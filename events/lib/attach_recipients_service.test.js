'use strict';

import * as chai from 'chai';
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');
import * as sinon from 'sinon';
import { Recipient } from 'moonmail-models';
import { AttachRecipientsService } from './attach_recipients_service';
import * as sinonAsPromised from 'sinon-as-promised';
const awsMock = require('aws-sdk-mock');
const AWS = require('aws-sdk');

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('AttachRecipientsService', () => {
  const userId = 'some_user_id';
  const userPlan = 'free';
  const listIds = ['some-list-id', 'another-list-id'];
  const sender = {apiKey: 'api-key', apiSecret: 'secret'};
  const campaign = {
    id: 'some_campaign_id',
    body: 'Hi {{ name }}, this is the body of the email',
    subject: 'Hi {{ name }} {{ surname }}',
    listIds
  };
  const recipients = Array(250).fill().map((el, i) => {
    return {
      id: i,
      listId: listIds[0],
      status: 'subscribed',
      email: `david.garcia+${i}@microapps.com`,
      metadata: {name: 'David', surname: i}
    };
  });
  const nextPage = 'next-page-token';
  const dbResponse = {items: recipients};
  const paginatedDbResponse = {items: recipients, nextPage};
  const campaignMessage = {userId, userPlan, campaign, sender};
  let snsClient;
  let service;
  let paginatedList;
  let nonPaginatedList;

  before(() => {
    awsMock.mock('SNS', 'publish', (params, cb) => {
      if (params.hasOwnProperty('Message') && params.hasOwnProperty('TopicArn')) {
        cb(null, {ReceiptHandle: 'STRING_VALUE'});
      } else {
        cb('Invalid params');
      }
    });
    snsClient = new AWS.SNS();
    service = new AttachRecipientsService(snsClient, campaignMessage);
    nonPaginatedList = listIds[0];
    paginatedList = listIds[1];
    sinon.stub(Recipient, 'allBy')
      .withArgs('listId', nonPaginatedList).resolves(dbResponse)
      .withArgs('listId', paginatedList).resolves(paginatedDbResponse);
  });

  describe('#attachAllRecipients', () => {
    before(() => {
      sinon.stub(service, 'attachRecipientsList').resolves(true);
    });

    it('attaches all recipients lists', done => {
      service.attachAllRecipients().then(() => {
        expect(service.attachRecipientsList).to.have.been.calledTwice;
        const firstCallParams = service.attachRecipientsList.firstCall.args[0];
        const secondCallParams = service.attachRecipientsList.secondCall.args[0];
        expect(firstCallParams).to.equal(listIds[0]);
        expect(secondCallParams).to.equal(listIds[1]);
        done();
      })
      .catch(err => done(err));
    });

    after(() => {
      service.attachRecipientsList.restore();
    });
  });

  describe('#attachRecipientsList', () => {
    before(() => {
      sinon.stub(service, '_getRecipientsBatch')
        .onFirstCall().resolves(paginatedDbResponse)
        .onSecondCall().resolves(paginatedDbResponse)
        .onThirdCall().resolves(dbResponse);
      sinon.spy(service, '_attachRecipientsBatch');
      sinon.spy(service, 'attachRecipientsList');
    });

    it('attaches all the recipients of a given list', done => {
      const listId = listIds[0];
      service.attachRecipientsList(listId).then(() => {
        expect(service.attachRecipientsList).to.have.been.calledThrice;
        const firstCallParams = service.attachRecipientsList.firstCall.args;
        const secondCallParams = service.attachRecipientsList.secondCall.args;
        expect(firstCallParams[0]).to.equal(listId);
        expect(firstCallParams[1]).to.be.undefined;
        expect(secondCallParams[0]).to.equal(listId);
        expect(secondCallParams[1]).to.deep.equal({nextPage});
        done();
      })
      .catch(err => done(err));
    });

    after(() => {
      service._getRecipientsBatch.restore();
      service._attachRecipientsBatch.restore();
      service.attachRecipientsList.restore();
    });
  });

  describe('#_attachRecipientsBatch()', () => {
    beforeEach(() => {
      sinon.spy(service, '_getRecipientsBatch');
      sinon.spy(service, '_publishRecipients');
    });

    it('publishes a batch of recipients', done => {
      service._attachRecipientsBatch(nonPaginatedList).then(() => {
        expect(service._publishRecipients).to.have.been.calledOnce;
        const publishParams = service._publishRecipients.lastCall.args[0];
        expect(publishParams).to.deep.equal(dbResponse.items);
        done();
      });
    });

    context('when the next page option was provided', () => {
      it('it fetches the next batch of recipients', done => {
        const options = {nextPage};
        service._attachRecipientsBatch(nonPaginatedList, options).then(() => {
          const getBatchOptions = service._getRecipientsBatch.lastCall.args[1];
          expect(getBatchOptions).to.have.property('nextPage', nextPage);
          done();
        });
      });
    });

    context('when processing the last batch', () => {
      it('resolves an empty object', done => {
        service._attachRecipientsBatch(nonPaginatedList).then(result => {
          expect(result).to.deep.equal({});
          done();
        });
      });
    });

    context('when there are batches left', () => {
      it('resolves the next page object', done => {
        service._attachRecipientsBatch(paginatedList).then(result => {
          expect(result).to.deep.equal({nextPage});
          done();
        })
        .catch(err => done(err));
      });
    });

    afterEach(() => {
      service._getRecipientsBatch.restore();
      service._publishRecipients.restore();
    });
  });

  describe('#_attachNextBatch()', () => {
    beforeEach(() => {
      sinon.stub(service, '_attachRecipientsBatch').resolves(true);
    });

    context('given a next page object', () => {
      it('sends the next batch', done => {
        const next = {nextPage};
        service._attachNextBatch(nonPaginatedList, next).then(() => {
          expect(service._attachRecipientsBatch).to.have.been.calledOnce;
          done();
        });
      });
    });

    context('given an empty object', () => {
      it('resolves true', done => {
        service._attachNextBatch().then(result => {
          expect(result).to.be.true;
          expect(service._attachRecipientsBatch).to.have.been.not.called;
          done();
        });
      });
    });

    afterEach(() => {
      service._attachRecipientsBatch.restore();
    });
  });

  describe('#_getRecipientsBatch()', () => {
    it('returns a batch of 250 subscribed recipients', done => {
      const getBatchPromise = service._getRecipientsBatch(listIds[0]);
      expect(getBatchPromise).to.eventually.have.deep.property('items', recipients);
      const allByOptions = Recipient.allBy.lastCall.args[2];
      expect(allByOptions.conditions).to.have.deep.equal({eq: {status: 'subscribed'}});
      expect(allByOptions.limit).to.equal(250);
      done();
    });

    context('when next page was provided', () => {
      it('returns the next batch of subscribed recipients', done => {
        const nextPage = 'next-page-handle';
        service._getRecipientsBatch(listIds[0], {nextPage}).then(() => {
          const allByOptions = Recipient.allBy.lastCall.args[2];
          expect(allByOptions).to.have.property('nextPage', nextPage);
          expect(allByOptions.conditions).to.have.deep.equal({eq: {status: 'subscribed'}});
          done();
        });
      });
    });
  });

  describe('#_publishRecipients()', () => {
    it('publishes the campaign message with the recipient info for every recipient', done => {
      const publishStub = sinon.stub(service, '_publishRecipient').resolves(true);
      service._publishRecipients(dbResponse.items).then(() => {
        expect(publishStub.callCount).to.equal(dbResponse.items.length);
        expect(publishStub.firstCall).to.be.calledWith(dbResponse.items[0]);
        done();
      });
      publishStub.restore();
    });
  });

  describe('#_buildRecipientMessage', () => {
    it('adds the recipient info to the message', done => {
      const recipient = dbResponse.items[0];
      const recipientMessage = service._buildRecipientMessage(recipient);
      expect(recipientMessage).to.include(campaignMessage);
      expect(recipientMessage.recipient).to.deep.equal(recipient);
      done();
    });
  });

  describe('#_publishRecipient()', () => {
    it('publishes the campaign message to SNS for certain recipient', done => {
      const recipient = dbResponse.items[0];
      snsClient.publish.reset();
      service._publishRecipient(recipient).then(() => {
        expect(snsClient.publish).to.have.been.calledOnce;
        const snsParams = snsClient.publish.lastCall.args[0];
        const expectedMessage = JSON.stringify(service._buildRecipientMessage(recipient));
        expect(snsParams).to.have.property('Message', expectedMessage);
        done();
      })
      .catch(err => done(err));
    });
  });

  after(() => {
    Recipient.allBy.restore();
    awsMock.restore('SNS');
  });
});
