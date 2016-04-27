'use strict';

import * as chai from 'chai';
const chaiAsPromised = require('chai-as-promised');
const chaiThings = require('chai-things');
import { expect } from 'chai';
import * as sinon from 'sinon';
import { EmailQueue } from './email_queue';
import { EnqueuedEmail } from './enqueued_email';
import { SendEmailService } from './send_email_service';
import * as sqsMessages from './sqs_receive_messages_response.json';
const awsMock = require('aws-sdk-mock');
const AWS = require('aws-sdk-promise');

chai.use(chaiAsPromised);
chai.use(chaiThings);

describe('SendEmailService', () => {
  let sesClient;
  let sqsClient;
  let email;
  let queue;

  before(() => {
    awsMock.mock('SES', 'sendEmail', { MessageId: 'some_message_id' });
    awsMock.mock('SQS', 'receiveMessage', sqsMessages);
    awsMock.mock('SQS', 'deleteMessage', { ResponseMetadata: { RequestId: 'e21774f2-6974-5d8b-adb2-3ba82afacdfc' } });
    sesClient = new AWS.SES();
    sqsClient = new AWS.SQS();
    queue = new EmailQueue(sqsClient, { url: 'https://some_url.com'});
  });

  describe('#sendBatch()', () => {
    context('when there are messages in the queue', () => {
      let senderService;
      const emailHandles = sqsMessages.Messages.map((message) => {
        return {ReceiptHandle: message.ReceiptHandle, Id: message.MessageId};
      });

      before(() => {
        senderService = new SendEmailService(queue);
      });

      it('returns the sent emails message handles', (done) => {
        expect(senderService.sendBatch()).to.eventually.deep.have.members(emailHandles).notify(done);
      });

      it('delivers all the emails', (done) => {
        sinon.spy(senderService, 'deliver');
        senderService.sendBatch().then(() => {
          expect(senderService.deliver.callCount).to.equal(emailHandles.length);
          senderService.deliver.restore();
          done();
        });
      });
    });
  });

  describe('#deliver()', () => {
    before(() => {
      const sqsMessage = sqsMessages.Messages[0];
      email = new EnqueuedEmail(JSON.parse(sqsMessage.Body), sqsMessage.ReceiptHandle);
    });

    it('sends the email', (done) => {
      const senderService = new SendEmailService(queue);
      senderService.setEmailClient(email);
      expect(senderService.deliver(email)).to.eventually.have.keys('MessageId').notify(done);
    });
  });

  after(() => {
    awsMock.restore('SES');
    awsMock.restore('SQS');
  });
});
