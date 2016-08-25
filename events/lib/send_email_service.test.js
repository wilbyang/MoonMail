'use strict';

import * as chai from 'chai';
const chaiAsPromised = require('chai-as-promised');
const chaiThings = require('chai-things');
const expect = chai.expect;
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
const sinonChai = require('sinon-chai');
const awsMock = require('aws-sdk-mock');
const AWS = require('aws-sdk');
import { EmailQueue } from './email_queue';
import { EnqueuedEmail } from './enqueued_email';
import { SendEmailService } from './send_email_service';
import * as sqsMessages from './sqs_receive_messages_response.json';

chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.use(chaiThings);

describe('SendEmailService', () => {
  let sqsClient;
  let email;
  let queue;
  const lambdaContext = {
    functionName: 'lambda-function-name',
    getRemainingTimeInMillis: () => {}
  };
  let contextStub;
  let lambdaClient;

  before(() => {
    awsMock.mock('SQS', 'receiveMessage', sqsMessages);
    awsMock.mock('SQS', 'deleteMessage', { ResponseMetadata: { RequestId: 'e21774f2-6974-5d8b-adb2-3ba82afacdfc' } });
    sqsClient = new AWS.SQS();
    queue = new EmailQueue(sqsClient, { url: 'https://some_url.com'});
    contextStub = sinon.stub(lambdaContext, 'getRemainingTimeInMillis').returns(100000);
    awsMock.mock('Lambda', 'invoke', 'ok');
    awsMock.mock('SNS', 'publish', 'ok');
    lambdaClient = new AWS.Lambda();
  });

  describe('#sendBatch()', () => {
    context('when there are messages in the queue', () => {
      let senderService;
      const emailHandles = sqsMessages.Messages.map((message) => {
        return {ReceiptHandle: message.ReceiptHandle, Id: message.MessageId};
      });

      before(() => {
        senderService = new SendEmailService(queue, null, contextStub);
        awsMock.mock('SES', 'sendEmail', { MessageId: 'some_message_id' });
      });

      it('returns the sent emails message handles', (done) => {
        expect(senderService.sendBatch()).to.eventually.deep.have.members(emailHandles).notify(done);
      });

      it('publish an SNS message for every sent email', (done) => {
        senderService.snsClient.publish.reset();
        senderService.sendBatch().then(() => {
          expect(senderService.snsClient.publish).to.be.calledOnce;
          const snsParams = senderService.snsClient.publish.lastCall.args[0];
          const snsPayload = JSON.parse(snsParams.Message);
          for (let sentEmail of snsPayload) {
            expect(sentEmail).to.have.property('messageId');
            expect(sentEmail).to.have.property('campaignId');
            expect(sentEmail).to.have.property('listId');
            expect(sentEmail).to.have.property('recipientId');
            expect(sentEmail).to.have.property('status');
          }
          done();
        }).catch(done);
      });

      it('delivers all the emails', (done) => {
        sinon.spy(senderService, 'deliver');
        senderService.sendBatch().then(() => {
          expect(senderService.deliver.callCount).to.equal(emailHandles.length);
          senderService.deliver.restore();
          done();
        });
      });

      context('when the sending rate is exceeded', () => {
        before(() => {
          sinon.stub(senderService, 'deliver').rejects({code: 'Throttling', message: 'Maximum sending rate exceeded'});
        });

        it('should leave the message in the queue', done => {
          senderService.sendBatch().then(() => {
            const emailsToDelete = JSON.parse(senderService.snsClient.publish.lastCall.args[0].Message);
            expect(emailsToDelete.length).to.equal(0);
            done();
          });
        });

        after(() => senderService.deliver.restore());
      });

      context('when the message is rejected', () => {
        before(() => {
          const deliverStub = sinon.stub(senderService, 'deliver');
          deliverStub
            .onFirstCall().resolves({ MessageId: 'some_message_id' })
            .onSecondCall().rejects({code: 'MessageRejected'});
        });

        it('should stop the execution', done => {
          senderService.sendBatch().catch(err => {
            expect(err).to.deep.equal({code: 'MessageRejected'});
            const emailsToDelete = JSON.parse(senderService.snsClient.publish.lastCall.args[0].Message);
            expect(emailsToDelete.length).to.equal(1);
            done();
          });
        });

        after(() => senderService.deliver.restore());
      });

      context('when the daily quota is exceeded', () => {
        before(() => {
          sinon.stub(senderService, 'deliver')
            .onFirstCall().resolves({ MessageId: 'some_message_id' })
            .onSecondCall().rejects({code: 'Throttling', message: 'Daily message quota exceeded'});
        });

        it('should stop the execution', done => {
          senderService.sendBatch().catch(err => {
            expect(err).to.have.property('code', 'Throttling');
            const emailsToDelete = JSON.parse(senderService.snsClient.publish.lastCall.args[0].Message);
            expect(emailsToDelete.length).to.equal(1);
            done();
          });
        });

        after(() => senderService.deliver.restore());
      });

      context('when an unexpected error occurs', () => {
        before(() => {
          sinon.stub(senderService, 'deliver').rejects({code: 'SomethingUnexpected'});
        });

        it('should delete the message from the queue', done => {
          senderService.sendBatch().then(emailsToDelete => {
            const emailsToSave = JSON.parse(senderService.snsClient.publish.lastCall.args[0].Message);
            expect(emailsToSave.length).to.equal(0);
            expect(emailsToDelete.length).to.equal(emailHandles.length);
            done();
          });
        });

        after(() => senderService.deliver.restore());
      });

      after(() => {
        awsMock.restore('SES');
      });
    });
  });

  describe('#sendNextBatch()', () => {
    context('when there is time for a new batch', () => {
      it('gets a new batch and delivers it', (done) => {
        const senderService = new SendEmailService(queue, lambdaClient, contextStub);
        done();
      });
    });
  });

  describe('#deliver()', () => {
    before(() => {
      awsMock.mock('SES', 'sendRawEmail', { MessageId: 'some_message_id' });
      const sqsMessage = sqsMessages.Messages[0];
      email = new EnqueuedEmail(JSON.parse(sqsMessage.Body), sqsMessage.ReceiptHandle);
      sinon.stub(email, 'toSesRawParams').resolves('test data');
    });

    it('sends the email', (done) => {
      const senderService = new SendEmailService(queue, null, contextStub);
      const emailClient = senderService.setEmailClient(email);
      senderService.deliver(email).then(res => {
        expect(emailClient.sendRawEmail).to.have.been.calledOnce;
        expect(emailClient.sendRawEmail).to.have.been.calledWith('test data');
        done();
      }).catch(done);
    });

    after(() => {
      awsMock.restore('SES');
    });
  });

  after(() => {
    awsMock.restore('SQS');
    awsMock.restore('SNS');
    awsMock.restore('Lambda');
    contextStub.restore();
  });
});
