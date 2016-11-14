'use strict';

import * as chai from 'chai';
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');
import { expect } from 'chai';
import * as sinon from 'sinon';
import { PrecompileEmailService } from './precompile_email_service';
import { Email } from './email';
import * as canonicalMessage from './send_email_topic_canonical_message.json';
const awsMock = require('aws-sdk-mock');
const AWS = require('aws-sdk-promise');

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('PrecompileEmailService', () => {
  const userApiKey = canonicalMessage.sender.apiKey;
  const fakeQueueUrl = 'https://somefakeurl.com/';
  const apiHost = 'myapi.com';
  const opensTrackingUrl = `https://${apiHost}/links/open/${canonicalMessage.campaign.id}?r=${canonicalMessage.recipient.id}`;
  const imgTrackingTag = `<img src="${opensTrackingUrl}" width="1" height="1" />`;
  let sqsClient;
  let precompileService;
  let emailParams;
  process.env.API_HOST = apiHost;

  before(() => {
    emailParams = JSON.parse(JSON.stringify(canonicalMessage));
    sqsClient = new AWS.SQS();
    precompileService = new PrecompileEmailService(sqsClient, emailParams);
  });

  describe('#constructor()', () => {
    it('initializes an EmailQueue object with the user\'s api key as name', (done) => {
      expect(precompileService.queue.name).to.equal(userApiKey);
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
  });

  describe('#composeEmail()', () => {
    it('returns an object with the SendEmail queue canonical format', (done) => {
      precompileService.composeEmail().then((composedEmail) => {
        expect(composedEmail.userId).to.equal(canonicalMessage.userId);
        expect(composedEmail.sender).to.deep.equal(canonicalMessage.sender);
        expect(composedEmail.campaign.id).to.equal(canonicalMessage.campaign.id);
        expect(composedEmail.recipient).to.have.property('email', canonicalMessage.recipient.email);
        expect(composedEmail.recipient).to.have.property('unsubscribeUrl');
        expect(composedEmail.campaign.body).to.contain(canonicalMessage.recipient.metadata.name);
        expect(composedEmail.campaign.subject).to.contain(canonicalMessage.recipient.metadata.name);
        done();
      }).catch(done);
    });

    it('appends the tracking pixel', (done) => {
      precompileService.composeEmail().then(composedEmail => {
        expect(composedEmail.campaign.body).to.contain(imgTrackingTag);
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

      it('creates a queue named after the user\'s api key', (done) => {
        precompileService.enqueueEmail().then(() => {
          expect(sqsClient.createQueue).to.have.been.calledWith({QueueName: userApiKey, Attributes: { MessageRetentionPeriod: 1209600 }});
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
          expect(sqsClient.getQueueUrl).to.have.been.calledWith({QueueName: userApiKey});
          expect(sqsClient.createQueue).to.have.callCount(0);
          expect(value).to.have.property('ReceiptHandle');
          done();
        });
      });

      after(() => {
        awsMock.restore('SQS');
        sqsClient.createQueue.restore();
      });
    });
  });

});
