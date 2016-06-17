'use strict';

import * as chai from 'chai';
import * as sinon from 'sinon';
import { expect } from 'chai';
import { SendTestEmailService } from './send_test_email_service';
const awsMock = require('aws-sdk-mock');
const AWS = require('aws-sdk');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

describe('SendTestEmailService', () => {
  let sesClient;
  let sendTestService;
  const subject = 'my campaign subject';
  const body = 'my campaign body';
  const emails = ['alua.kinzhebayeva@microapps.com', 'carlos.castellanos@microapps.com'];
  const fromEmail = 'david.garcia@microapps.com';
  process.env.DEFAULT_EMAIL_ADDRESS = fromEmail;

  describe('#sendEmail', () => {
    context('when the campaign has the needed parameters', () => {
      before(() => {
        awsMock.mock('SES', 'sendEmail', { MessageId: 'some_message_id' });
        sesClient = new AWS.SES();
        sendTestService = new SendTestEmailService(sesClient, {subject, body, emails});
      });

      it('sends the campaign', done => {
        sendTestService.sendEmail().then(res => {
          expect(sesClient.sendEmail).to.have.been.calledOnce;
          const sesArgs = sesClient.sendEmail.lastCall.args[0];
          expect(sesArgs).to.have.property('Source', fromEmail);
          expect(sesArgs).to.have.deep.property('Destination.ToAddresses', emails);
          expect(sesArgs).to.have.deep.property('Message.Body.Html.Data', body);
          expect(sesArgs).to.have.deep.property('Message.Subject.Data', `[TEST] ${subject}`);
          done();
        })
        .catch(err => done(err));
      });

      after(() => {
        awsMock.restore('SES');
      });
    });

    context('when the campaign is incomplete', () => {
      before(() => {
        sendTestService = new SendTestEmailService(null, {body, emails});
      });

      it('rejects the promise', done => {
        const testEmailPromise = sendTestService.sendEmail();
        expect(testEmailPromise).to.be.rejectedWith(Error, 'Params missing').notify(done);
      });
    });
  });
});
