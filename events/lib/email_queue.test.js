import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chaiThings from 'chai-things';
import awsMock from 'aws-sdk-mock';
import * as sinon from 'sinon';
import 'sinon-as-promised';
import AWS from 'aws-sdk-promise';
import { EmailQueue } from './email_queue';
import { EnqueuedEmail } from './enqueued_email';
import * as sqsMessages from './sqs_receive_messages_response.json';
import { uncompressString } from './utils';

const expect = chai.expect;
chai.use(chaiAsPromised);
chai.use(chaiThings);

describe('EmailQueue', () => {
  const fakeQueueUrl = 'https://somefakeurl.com';
  let sqsClient;

  before(() => {
    awsMock.mock('SQS', 'getQueueUrl', {QueueUrl: fakeQueueUrl});
    awsMock.mock('SQS', 'createQueue', {QueueUrl: fakeQueueUrl});
    awsMock.mock('SQS', 'sendMessage', (params, cb) => {
      if (params.hasOwnProperty('MessageBody') && params.hasOwnProperty('QueueUrl')) {
        cb(null, {ReceiptHandle: 'STRING_VALUE'});
      } else {
        cb('Invalid params');
      }
    });
    awsMock.mock('SQS', 'receiveMessage', sqsMessages);
    awsMock.mock('SQS', 'deleteMessage', { ResponseMetadata: { RequestId: 'e21774f2-6974-5d8b-adb2-3ba82afacdfc' } });
    awsMock.mock('SQS', 'deleteMessageBatch', {
      ResponseMetadata: { RequestId: '57' },
      Successful: [{ Id: '07e7' }],
      Failed: []
    });
    sqsClient = new AWS.SQS();
  });

  describe('#queueUrl()', () => {
    context('when the url was provided', () => {
      it('returns the url', (done) => {
        const url = 'https://someurl.com';
        const queue = new EmailQueue(null, {url});
        expect(queue.getUrl()).to.eventually.equal(url).notify(done);
      });

      context('when the name was provided', () => {
        it('fetches the url from AWS', (done) => {
          const queue = new EmailQueue(sqsClient, {name: 'MyQueueName'});
          expect(queue.getUrl()).to.eventually.equal(fakeQueueUrl).notify(done);
        });
      });
    });
  });

  describe('#retrieveMessages()', () => {
    it('returns a list of EnqueuedEmail objects', (done) => {
      const queue = new EmailQueue(sqsClient, {url: fakeQueueUrl});
      queue.retrieveMessages().then((result) => {
        expect(result).to.be.all.an.instanceOf(EnqueuedEmail);
        done();
      });
    });

    it('creates EnqueuedEmail objects correctly', (done) => {
      const queue = new EmailQueue(sqsClient, {url: fakeQueueUrl});
      queue.retrieveMessages().then((result) => {
        const someMessage = sqsMessages.Messages[0];
        const emailQueueMessage = result.find((item) => {
          return item.receiptHandle === someMessage.ReceiptHandle;
        });
        expect(emailQueueMessage).to.exist;
        const canonicalMessage = JSON.parse(someMessage.Body);
        const uncompressedBody = uncompressString(canonicalMessage.campaign.body);
        canonicalMessage.campaign.body = uncompressedBody;
        expect(emailQueueMessage.message).to.deep.equal(canonicalMessage);
        expect(emailQueueMessage.messageId).to.equal(someMessage.MessageId);
        done();
      }).catch(done);
    });
  });

  describe('#removeMessage()', () => {
    it('removes the message correctly', (done) => {
      const queue = new EmailQueue(sqsClient, {name: 'MyQueueName'});
      const someMessageHandle = 'some_message_handle';
      expect(queue.removeMessage(someMessageHandle)).to.eventually.have.deep.property('ResponseMetadata.RequestId').notify(done);
    });
  });

  describe('#removeMessages()', () => {
    it('removes the batch correctly', (done) => {
      const queue = new EmailQueue(sqsClient, {name: 'MyQueueName'});
      const someBatch = [
        {ReceiptHandle: 'some_message_handle', Id: 'some_message_id'},
        {ReceiptHandle: 'some_message_handle_1', Id: 'some_message_id_1'}
      ];
      expect(queue.removeMessages(someBatch)).to.eventually.have.keys(['ResponseMetadata', 'Successful', 'Failed']).notify(done);
    });
  });

  describe('#_createQueue()', () => {
    it('creates a queue correctly', (done) => {
      const queue = new EmailQueue(sqsClient, {name: 'MyQueueName'});
      sinon.stub(queue, '_createAlarm').resolves(true);
      expect(queue._createQueue()).to.eventually.equal(fakeQueueUrl).notify(done);
    });
  });

  describe('#getOrCreateQueue()', () => {
    let queue;

    context('when the queue exists', () => {
      before(() => {
        queue = new EmailQueue(sqsClient, {name: 'MyQueueName'});
        sinon.stub(queue, '_fetchUrl').resolves(fakeQueueUrl);
      });

      it('retrieves the queue url', (done) => {
        expect(queue.getOrCreateQueue()).to.eventually.equal(fakeQueueUrl).notify(done);
      });

      after(() => {
        queue._fetchUrl.restore();
      });
    });

    context('when the queue does not exist', () => {
      before(() => {
        queue = new EmailQueue(sqsClient, {name: 'MyQueueName'});
        sinon.stub(queue, '_fetchUrl').rejects({code: 'AWS.SimpleQueueService.NonExistentQueue'});
        sinon.spy(queue, '_createQueue');
        sinon.stub(queue, '_createAlarm').resolves(true);
      });

      it('creates a new queue', (done) => {
        queue.getOrCreateQueue().then(() => {
          expect(queue._createQueue.callCount).to.equal(1);
          done();
        });
      });

      it('returns the newly created queue url', (done) => {
        expect(queue.getOrCreateQueue()).to.eventually.equal(fakeQueueUrl).notify(done);
      });

      after(() => {
        queue._createQueue.restore();
        queue._fetchUrl.restore();
        queue._createAlarm.restore();
      });
    });
  });

  describe('#putMessage()', () => {
    it('inserts the message correctly', (done) => {
      const queue = new EmailQueue(sqsClient, {name: 'MyQueueName'});
      const payload = JSON.stringify({ some_message: 'some_message_body'});
      queue.putMessage(payload).then((value) => {
        expect(value).to.have.property('ReceiptHandle');
        expect(sqsClient.sendMessage.callCount).to.equal(1);
        done();
      });
    });
  });

  after(() => {
    awsMock.restore('SQS');
  });
});
