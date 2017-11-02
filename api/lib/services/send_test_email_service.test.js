import chai from 'chai';
import sinon from 'sinon';
import awsMock from 'aws-sdk-mock';
import AWS from 'aws-sdk';
import chaiAsPromised from 'chai-as-promised';
import { SendTestEmailService } from './send_test_email_service';

const expect = chai.expect;
chai.use(chaiAsPromised);

describe('SendTestEmailService', () => {
  let sesClient;
  let sendTestService;
  const subject = 'my campaign subject';
  const body = 'my campaign body';
  const emails = ['alua.kinzhebayeva@microapps.com', 'carlos.castellanos@microapps.com'];
  const fromEmail = 'david.garcia@microapps.com';
  const sender = { emailAddress: fromEmail };
  process.env.DEFAULT_EMAIL_ADDRESS = fromEmail;

  describe('#sendEmail', () => {
    context('when the campaign has the needed parameters', () => {
      beforeEach(() => {
        awsMock.mock('SES', 'sendEmail', { MessageId: 'some_message_id' });
        sesClient = new AWS.SES();
      });
      afterEach(() => awsMock.restore('SES'));

      it('sends the campaign', done => {
        sendTestService = new SendTestEmailService(sesClient, { subject, body, emails });
        sendTestService.sendEmail().then(res => {
          expect(sesClient.sendEmail).to.have.been.calledOnce;
          const sesArgs = sesClient.sendEmail.lastCall.args[0];
          expect(sesArgs).to.have.property('Source', fromEmail);
          expect(sesArgs).to.have.deep.property('Destination.ToAddresses', emails);
          expect(sesArgs).to.have.deep.property('Message.Body.Html.Data', body);
          expect(sesArgs).to.have.deep.property('Message.Subject.Data', `[MoonMail-TEST] ${subject}`);
          done();
        })
          .catch(err => done(err));
      });

      context('and a custom email from is provided', () => {
        it('should use the custom email', done => {
          const customEmail = 'my-email@test.com';
          sendTestService = new SendTestEmailService(sesClient, { subject, body, emails, sender: { emailAddress: customEmail } });
          sendTestService.sendEmail().then(res => {
            expect(sesClient.sendEmail).to.have.been.calledOnce;
            const sesArgs = sesClient.sendEmail.lastCall.args[0];
            expect(sesArgs).to.have.property('Source', customEmail);
            done();
          })
            .catch(err => done(err));
        });
      });


      context('and the body contains liquid tags', () => {
        it('parses the liquid tags', (done) => {
          const metadata = { name: 'David' };
          const bodyTemplate = 'Hi {{ name }} {% if noexisting %}no displayed{% endif %}, this email is for you!';
          const bodyParsed = `Hi ${metadata.name} , this email is for you!`;
          sendTestService = new SendTestEmailService(sesClient, { subject, body: bodyTemplate, emails, metadata });
          sendTestService.sendEmail().then(res => {
            const sesArgs = sesClient.sendEmail.lastCall.args[0];
            expect(sesArgs).to.have.deep.property('Message.Body.Html.Data', bodyParsed);
            done();
          })
            .catch(err => done(err));
        });
      });
    });

    context('when the campaign is incomplete', () => {
      before(() => {
        sendTestService = new SendTestEmailService(null, { body, emails });
      });

      it('rejects the promise', done => {
        const testEmailPromise = sendTestService.sendEmail();
        expect(testEmailPromise).to.be.rejectedWith(Error, 'Params missing').notify(done);
      });
    });
  });
});
