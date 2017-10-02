import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
import sinon from 'sinon';
import awsMock from 'aws-sdk-mock';
import AWS from 'aws-sdk-promise';
import { PrecompileEmailService } from './precompile_email_service';
import { Email } from './email';
import * as canonicalMessage from './send_email_topic_canonical_message.json';
import { compressString, uncompressString } from './utils';

const expect = chai.expect;
chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('PrecompileEmailService', () => {
  const userApiKey = canonicalMessage.sender.apiKey;
  const fakeQueueUrl = 'https://somefakeurl.com/';
  const apiHost = 'myapi.com';
  const opensTrackingUrl = `https://${apiHost}/links/open/${canonicalMessage.campaign.id}?r=${canonicalMessage.recipient.id}`;
  const imgTrackingTag = `<img src="${opensTrackingUrl}`;
  const compressedBody = compressString(canonicalMessage.campaign.body);
  let sqsClient;
  let precompileService;
  let emailParams;

  before(() => {
    process.env.API_HOST = apiHost;
    emailParams = JSON.parse(JSON.stringify(canonicalMessage));
    emailParams.campaign.body = compressedBody;
    sqsClient = new AWS.SQS();
    precompileService = new PrecompileEmailService(sqsClient, emailParams);
  });

  describe('#constructor()', () => {
    it('initializes an EmailQueue object with the user\'s id as name', (done) => {
      expect(precompileService.queue.name).to.equal(canonicalMessage.userId);
      done();
    });

    it('initializes an Email object', (done) => {
      expect(precompileService.email).to.be.an.instanceOf(Email);
      expect(precompileService.email.from).to.equal(canonicalMessage.sender.emailAddress);
      expect(precompileService.email.to).to.equal(canonicalMessage.recipient.email);
      expect(precompileService.email.body).to.equal(canonicalMessage.campaign.body);
      expect(precompileService.email.subject).to.equal(canonicalMessage.campaign.subject);
      expect(precompileService.email.metadata).to.deep.equal(canonicalMessage.recipient.metadata);
      done();
    });

    context('when the campaign has address in metadata', () => {
      it('should process it and merge it with recipient\'s one', done => {
        const address = {
          address: 'C/ Severo Ochoa',
          address2: 'Edificio Promalaga',
          city: 'Málaga',
          company: 'microapps S.L.',
          country: 'Spain',
          state: 'Málaga',
          zipCode: '29590'
        };
        const camapaignMetadata = {address};
        const metadataEmailParams = JSON.parse(JSON.stringify(emailParams));
        metadataEmailParams.campaign.metadata = camapaignMetadata;
        const expectedAddressTag = `<p style="text-align: center;"><b>Our address is:</b></br>${address.company}</br>${address.address} ${address.address2}</br>${address.zipCode} ${address.city}</br>${address.state} ${address.country}</br><p>`;
        const metadataPrecompileService = new PrecompileEmailService(sqsClient, metadataEmailParams);
        expect(metadataPrecompileService.email.metadata).to.have.property('address', expectedAddressTag);
        done();
      });
    });
  });

  describe('#composeEmail()', () => {
    it('returns an object with the SendEmail queue canonical format', (done) => {
      precompileService.composeEmail().then((composedEmail) => {
        const uncompressedBody = uncompressString(composedEmail.campaign.body);
        expect(composedEmail.userId).to.equal(canonicalMessage.userId);
        expect(composedEmail.sender).to.deep.equal(canonicalMessage.sender);
        expect(composedEmail.campaign.id).to.equal(canonicalMessage.campaign.id);
        expect(composedEmail.recipient).to.have.property('email', canonicalMessage.recipient.email);
        expect(composedEmail.recipient).to.have.property('unsubscribeUrl');
        expect(uncompressedBody).to.contain(canonicalMessage.recipient.metadata.name);
        expect(composedEmail.campaign.subject).to.contain(canonicalMessage.recipient.metadata.name);
        done();
      }).catch(done);
    });

    it('appends the tracking pixel', (done) => {
      precompileService.composeEmail().then(composedEmail => {
        const uncompressedBody = uncompressString(composedEmail.campaign.body);
        expect(uncompressedBody).to.contain(imgTrackingTag);
        done();
      }).catch(done);
    });
  });

  describe('#enqueueEmail()', () => {
    context('when the user\'s queue does not exist', () => {
      before(() => {
        awsMock.mock('CloudWatch', 'putMetricAlarm', true);
        awsMock.mock('SQS', 'getQueueUrl', (params, cb) => {
          const error = {code: 'AWS.SimpleQueueService.NonExistentQueue'};
          cb(error);
        });
        awsMock.mock('SQS', 'createQueue', (params, cb) => {
          const value = {QueueUrl: `${fakeQueueUrl}${params.QueueName}`};
          cb(null, value);
        });
        awsMock.mock('SQS', 'sendMessage', {ReceiptHandle: 'some_handle'});
        sqsClient = new AWS.SQS();
        precompileService = new PrecompileEmailService(sqsClient, emailParams);
      });

      it('creates a queue named after the user\'s id', (done) => {
        precompileService.enqueueEmail().then(() => {
          expect(sqsClient.createQueue).to.have.been.calledWith({ QueueName: canonicalMessage.userId.replace('|', '_') });
          done();
        });
      });

      it('enqueues the composed email in the newly created queue', (done) => {
        expect(precompileService.enqueueEmail()).to.eventually.have.property('QueueName');
        done();
      });

      after(() => {
        awsMock.restore('SQS');
        awsMock.restore('CloudWatch');
      });
    });

    context('when the user\'s queue exists', () => {
      before(() => {
        awsMock.mock('SQS', 'getQueueUrl', (params, cb) => {
          const value = {QueueUrl: `${fakeQueueUrl}${params.QueueName}`};
          cb(null, value);
        });
        awsMock.mock('SQS', 'sendMessage', {ReceiptHandle: 'some_handle'});
        sqsClient = new AWS.SQS();
        sinon.spy(sqsClient, 'createQueue');
        precompileService = new PrecompileEmailService(sqsClient, emailParams);
      });

      it('enqueues the composed email in the queue named after the user\'s api key', (done) => {
        precompileService.enqueueEmail().then((value) => {
          expect(sqsClient.getQueueUrl).to.have.been.calledWith({QueueName: canonicalMessage.userId.replace('|', '_')});
          expect(sqsClient.createQueue).to.have.callCount(0);
          expect(value).to.have.property('ReceiptHandle');
          done();
        });
      });

      after(() => {
        awsMock.restore('SQS');
        sqsClient.createQueue.restore();
        delete process.env.API_HOST;
      });
    });
  });
});
