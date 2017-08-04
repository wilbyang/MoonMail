import './spec_helper';

import awsMock from 'aws-sdk-mock';
import AWS from 'aws-sdk';

import { Recipient } from 'moonmail-models';
import { AttachListRecipientsService } from './attach_list_recipients_service';

describe('AttachListRecipientsService', () => {
  const userId = 'some_user_id';
  const userPlan = 'free';
  const listIds = ['some-list-id', 'another-list-id'];
  const sender = { apiKey: 'api-key', apiSecret: 'secret' };
  const campaign = {
    id: 'some_campaign_id',
    body: 'Hi {{ name }}, this is the body of the email',
    subject: 'Hi {{ name }} {{ surname }}',
    listIds
  };
  const recipients = Array(250).fill().map((el, i) => ({
    id: i,
    listId: listIds[0],
    status: 'subscribed',
    email: `david.garcia+${i}@microapps.com`,
    metadata: { name: 'David', surname: i }
  }));
  const nextPage = 'next-page-token';
  const dbResponse = { items: recipients };
  const paginatedDbResponse = { items: recipients, nextPage };
  const attachListRecipientsMessage = { userId, userPlan, campaign, sender };
  const lambdaContext = {
    functionName: 'lambda-function-name',
    getRemainingTimeInMillis: () => { }
  };
  let lambdaClient;
  let contextStub;
  let snsClient;
  let service;
  let paginatedList;
  let nonPaginatedList;

  before(() => {
    awsMock.mock('SNS', 'publish', (params, cb) => {
      if (params.hasOwnProperty('Message') && params.hasOwnProperty('TopicArn')) {
        cb(null, { ReceiptHandle: 'STRING_VALUE' });
      } else {
        cb('Invalid params');
      }
    });
    awsMock.mock('Lambda', 'invoke', (params, callback) => { callback(null, true); });
    lambdaClient = new AWS.Lambda();
    snsClient = new AWS.SNS();
    service = new AttachListRecipientsService(snsClient, attachListRecipientsMessage, lambdaClient, lambdaContext);
    nonPaginatedList = listIds[0];
    paginatedList = listIds[1];
    contextStub = sinon.stub(lambdaContext, 'getRemainingTimeInMillis').returns(100000);
    sinon.stub(Recipient, 'allBy')
      .withArgs('listId', nonPaginatedList).resolves(dbResponse)
      .withArgs('listId', paginatedList).resolves(paginatedDbResponse);
  });

  describe('attaching recipients', () => {
    before(() => {
      sinon.stub(service, '_getRecipientsBatch')
        .onFirstCall().resolves(paginatedDbResponse)
        .onSecondCall().resolves(paginatedDbResponse)
        .onThirdCall().resolves(dbResponse);
      sinon.spy(service, '_attachRecipientsBatch');
      sinon.spy(service, 'attachRecipients');
    });

    it('attaches all the recipients of a given list', (done) => {
      service.attachRecipients().then(() => {
        expect(service.attachRecipients).to.have.been.calledThrice;
        const firstCallParams = service.attachRecipients.firstCall.args;
        const secondCallParams = service.attachRecipients.secondCall.args;
        expect(firstCallParams[0]).to.be.undefined;
        expect(secondCallParams[0]).to.deep.equal({ page: nextPage });
        done();
      })
        .catch(err => done(err));
    });

    after(() => {
      service._getRecipientsBatch.restore();
      service._attachRecipientsBatch.restore();
      service.attachRecipients.restore();
    });
  });

  describe('#_attachRecipientsBatch()', () => {
    beforeEach(() => {
      sinon.spy(service, '_getRecipientsBatch');
      sinon.spy(service, '_publishRecipients');
    });

    it('publishes a batch of recipients', (done) => {
      service._attachRecipientsBatch(nonPaginatedList).then(() => {
        expect(service._publishRecipients).to.have.been.calledOnce;
        const publishParams = service._publishRecipients.lastCall.args[0];
        expect(publishParams).to.deep.equal(dbResponse.items);
        done();
      });
    });

    context('when the next page option was provided', () => {
      it('it fetches the next batch of recipients', (done) => {
        const options = { page: nextPage };
        service._attachRecipientsBatch(nonPaginatedList, options).then(() => {
          const getBatchOptions = service._getRecipientsBatch.lastCall.args[1];
          expect(getBatchOptions).to.have.property('page', nextPage);
          done();
        });
      });
    });

    context('when processing the last batch', () => {
      it('resolves an empty object', (done) => {
        service._attachRecipientsBatch(nonPaginatedList).then((result) => {
          expect(result).to.deep.equal({});
          done();
        });
      });
    });

    context('when there are batches left', () => {
      it('resolves the next page object', (done) => {
        service._attachRecipientsBatch(paginatedList).then((result) => {
          expect(result).to.deep.equal({ page: nextPage });
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
      it('sends the next batch', (done) => {
        const next = { page: nextPage };
        service._attachNextBatch(nonPaginatedList, next).then(() => {
          expect(service._attachRecipientsBatch).to.have.been.calledOnce;
          done();
        });
      });
    });

    context('given an empty object', () => {
      it('resolves true', (done) => {
        service._attachNextBatch().then((result) => {
          expect(result).to.be.true;
          expect(service._attachRecipientsBatch).to.have.been.not.called;
          done();
        });
      });
    });

    context('there is not enough time to process a next batch', () => {
      it('invokes a new lambda', (done) => {
        const next = { page: nextPage };
        service._attachNextBatch(next).then((result) => {
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
    it('returns a batch of 250 subscribed recipients', (done) => {
      const getBatchPromise = service._getRecipientsBatch(listIds[0]);
      expect(getBatchPromise).to.eventually.have.deep.property('items', recipients);
      const allByOptions = Recipient.allBy.lastCall.args[2];
      expect(allByOptions.filters).to.have.deep.equal({ status: { eq: 'subscribed' } });
      expect(allByOptions.limit).to.equal(250);
      done();
    });

    context('when next page was provided', () => {
      it('returns the next batch of subscribed recipients', (done) => {
        const nextPage = 'next-page-handle';
        service._getRecipientsBatch(listIds[0], { nextPage }).then(() => {
          const allByOptions = Recipient.allBy.lastCall.args[2];
          expect(allByOptions).to.have.property('nextPage', nextPage);
          expect(allByOptions.filters).to.have.deep.equal({ status: { eq: 'subscribed' } });
          done();
        });
      });
    });
  });

  describe('#_publishRecipients()', () => {
    it('publishes the campaign message with the recipient info for every recipient', (done) => {
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
    it('adds the recipient info to the message', (done) => {
      const recipient = dbResponse.items[0];
      const recipientMessage = service._buildRecipientMessage(recipient);
      expect(recipientMessage).to.include({ campaign });
      expect(recipientMessage).to.include({ userId });
      expect(recipientMessage).to.include({ sender });
      expect(recipientMessage.recipient).to.deep.equal(recipient);
      done();
    });
  });

  describe('#_publishRecipient()', () => {
    it('publishes the campaign message to SNS for certain recipient', (done) => {
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

  describe('recursive calls', () => {
    before(() => {
      sinon.stub(service, '_timeEnough').returns(false);
    });

    it('invokes the same lambda function with a new offset to start on', (done) => {
      service._attachNextBatch(listIds[0], { page: nextPage }).then(() => {
        expect(lambdaClient.invoke).to.have.been.calledOne;
        const payload = JSON.parse(lambdaClient.invoke.lastCall.args[0].Payload);
        expect(payload.batchOffset).to.deep.equals({ page: nextPage });
        done();
      }).catch(err => done(err));
    });

    after(() => {
      service._timeEnough.restore();
    });
  });

  after(() => {
    Recipient.allBy.restore();
    awsMock.restore('SNS');
    awsMock.restore('Lambda');
  });
});
