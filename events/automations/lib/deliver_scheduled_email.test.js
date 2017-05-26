import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import awsMock from 'aws-sdk-mock';
import AWS from 'aws-sdk';
import { EnqueuedEmail } from '../../lib/enqueued_email';
import DesliverScheduledEmail from './deliver_scheduled_email';

const expect = chai.expect;
chai.use(sinonChai);

describe('DesliverScheduledEmail', () => {
  const sender = {emailAddress: 'test@test.com', fromName: 'test', apiKey: 123, apiSecret: 456, region: 'usa'};

  describe('.initEmailClient', () => {
    const client = {the: 'client'};
    before(() => sinon.stub(AWS, 'SES').returns(client));
    after(() => AWS.SES.restore());

    it('should create an email client with the provided credentials', () => {
      const result = DesliverScheduledEmail.initEmailClient(sender);
      const expected = {
        accessKeyId: sender.apiKey,
        secretAccessKey: sender.apiSecret,
        region: sender.region
      };
      expect(AWS.SES).to.have.been.calledWithExactly(expected);
      expect(result).to.deep.equal(client);
    });
  });

  describe('.execute()', () => {
    const scheduledEmail = {
      sender,
      recipient: {id: 123, email: 'recipient@test.com', listId: 123},
      campaign: {body: 'body', subject: 'subject', id: 123}
    };
    const enqueuedEmail = new EnqueuedEmail(scheduledEmail);
    const sesResult = {MessageId: 987};

    beforeEach(() => {
      sinon.stub(DesliverScheduledEmail, '_buildEnqueuedEmail').returns(enqueuedEmail);
      awsMock.mock('SES', 'sendRawEmail', sesResult);
    });
    afterEach(() => {
      DesliverScheduledEmail._buildEnqueuedEmail.restore();
      awsMock.restore('SES');
    });

    it('should return the EnqueuedEmail instance and the message id', async () => {
      const result = await DesliverScheduledEmail.execute(scheduledEmail);
      const expected = {
        email: enqueuedEmail,
        messageId: sesResult.MessageId
      };
      expect(result).to.deep.equal(expected);
    });

    context('when there was some error', () => {
      context('and it is not retryable', () => {
        const error = {code: 'MessageRejected'};
        before(() => {
          awsMock.mock('SES', 'sendRawEmail', (params, cb) => cb(error));
        });
        after(() => {
          awsMock.restore('SES');
        });
        it('should return the email and error flag', async () => {
          const result = await DesliverScheduledEmail.execute(scheduledEmail);
          const expected = {email: enqueuedEmail, error, retryable: false};
          expect(result).to.deep.equal(expected);
        });
      });

      context('and it is retryable', () => {
        const error = {code: 'Throttling', message: 'maximum sending rate exceeded'};
        before(() => {
          awsMock.mock('SES', 'sendRawEmail', (params, cb) => cb(error));
        });
        after(() => {
          awsMock.restore('SES');
        });
        it('should also include retryable flag to true', async () => {
          const result = await DesliverScheduledEmail.execute(scheduledEmail);
          const expected = {email: enqueuedEmail, error, retryable: true};
          expect(result).to.deep.equal(expected);
        });
      });
    });
  });
});
