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
  const sender = { apiKey: 'api-key', apiSecret: 'secret' };
  const campaign = {
    id: 'some_campaign_id',
    body: 'Hi {{ name }}, this is the body of the email',
    subject: 'Hi {{ name }} {{ surname }}',
    listIds
  };

  const campaignMessage = { userId, userPlan, campaign, sender };
  let snsClient;
  let service;

  before(() => {
    awsMock.mock('SNS', 'publish', (params, cb) => {
      if (params.hasOwnProperty('Message') && params.hasOwnProperty('TopicArn')) {
        cb(null, { ReceiptHandle: 'STRING_VALUE' });
      } else {
        cb('Invalid params');
      }
    });
    snsClient = new AWS.SNS();
    service = new AttachRecipientsService(snsClient, campaignMessage);
    sinon.stub(service, '_notifyAttachListRecipients').resolves(true);
    sinon.stub(service, '_notifyToUpdateCampaignStatus').resolves(true);
    sinon.stub(service, '_notifyToSendEmails').resolves(true);
    sinon.stub(service, '_wait').resolves(true);
  });

  describe('#notifyAttachListRecipients', () => {
    it('notifies lists recipients attachers', done => {
      service.notifyAttachListRecipients().then(() => {
        expect(service._notifyAttachListRecipients).to.have.been.calledTwice;

        const firstCall = service._notifyAttachListRecipients.firstCall.args[0];
        expect(firstCall).to.include({ sender });
        expect(firstCall).to.include({ campaign });
        expect(firstCall).to.include({ userId });
        expect(firstCall).to.include({ userPlan });
        expect(firstCall).to.include({ listId: listIds[0] });

        const lastCall = service._notifyAttachListRecipients.lastCall.args[0];
        expect(lastCall).to.include({ sender });
        expect(lastCall).to.include({ campaign });
        expect(lastCall).to.include({ userId });
        expect(lastCall).to.include({ userPlan });
        expect(lastCall).to.include({ listId: listIds[1] });

        expect(service._notifyToUpdateCampaignStatus).to.have.been.calledOnce;
        expect(service._notifyToSendEmails).to.have.been.calledOnce;
        expect(service._wait).to.have.been.calledOnce;
        done();
      }).catch(err => done(err));
    });
  });

  after(() => {
    awsMock.restore('SNS');
    service._notifyAttachListRecipients.restore();
    service._notifyToUpdateCampaignStatus.restore();
    service._notifyToSendEmails.restore();
    service._wait.restore();
  });
});
