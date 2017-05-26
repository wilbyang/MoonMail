import chai from 'chai';
import sinon from 'sinon';
import 'sinon-as-promised';
import sinonChai from 'sinon-chai';
import faker from 'faker';
import { ScheduledEmail } from 'moonmail-models';
import SendAutomationScheduledEmails from './send_automation_scheduled_emails';
import SendScheduledEmails from './send_scheduled_emails';

const expect = chai.expect;
chai.use(sinonChai);

const generateScheduledEmail = (options = {}) => {
  const defaults = {
    campaign: {body: 'Email body', subject: 'Email subject'},
    id: faker.random.alphaNumeric(5),
    recipient: {
      email: 'david.garcia@microapps.com',
      id: faker.random.alphaNumeric(5),
      listId: faker.random.alphaNumeric(5),
      metadata: {name: 'David', surname: 'García'}
    },
    scheduledAt: 1495452351,
    sender: {
      apiKey: faker.random.alphaNumeric(5),
      apiSecret: faker.random.alphaNumeric(5),
      emailAddress: 'david.garcia@microapps.com',
      fromName: 'David',
      id: faker.random.alphaNumeric(5),
      region: 'eu-west-1'
    },
    userId: faker.random.alphaNumeric(5),
    automationId: faker.random.alphaNumeric(5),
    automationActionId: faker.random.alphaNumeric(5)
  };
  return Object.assign({}, defaults, options);
};
const generateScheduledEmails = ({quantity = 3, userId = 'david', automationId}) =>
  Array(quantity).fill().map(() => generateScheduledEmail({automationId, userId}));

describe('SendScheduledEmails', () => {
  describe('.execute()', () => {
    const validEmails = generateScheduledEmails({automationId: 'valid'});
    const validEmailsResult = validEmails.map(email => ({email}));
    const erroredEmails = generateScheduledEmails({automationId: 'errored'});
    const erroredEmailsResult = erroredEmails.map(email => ({email, error: 'foo'}));
    const retryableEmails = generateScheduledEmails({automationId: 'retryable'});
    const retryableEmailsResult = retryableEmails
      .map(email => ({email, error: 'bar', retryable: true}));
    const allScheduledEmails = validEmails.concat(erroredEmails, retryableEmails);

    beforeEach(() => {
      sinon.stub(ScheduledEmail, 'toBeSent').resolves(allScheduledEmails);
      sinon.stub(SendAutomationScheduledEmails, 'execute')
        .withArgs(validEmails).resolves(validEmailsResult)
        .withArgs(erroredEmails).resolves(erroredEmailsResult)
        .withArgs(retryableEmails).resolves(retryableEmailsResult)
        .withArgs(sinon.match.any).rejects('Some error');
      sinon.stub(ScheduledEmail, 'update').resolves(true);
    });
    afterEach(() => {
      ScheduledEmail.toBeSent.restore();
      SendAutomationScheduledEmails.execute.restore();
      ScheduledEmail.update.restore();
    });

    it('should send emails grouped by automation', async () => {
      const result = await SendScheduledEmails.execute();
      const sendFunction = SendAutomationScheduledEmails.execute;
      expect(sendFunction).to.have.been.calledThrice;
      expect(sendFunction).to.have.been.calledWithExactly(validEmails);
      expect(sendFunction).to.have.been.calledWithExactly(erroredEmails);
      expect(sendFunction).to.have.been.calledWithExactly(retryableEmails);
    });

    it('should update scheduled emails statuses accordingly', async () => {
      const genUpdateParams = (scheduledEmail, options = {}) =>
        Object.assign({},
          {id: scheduledEmail.id, automationActionId: scheduledEmail.automationActionId},
          options
        );
      const expectedValid = validEmails
        .map(email => genUpdateParams(email,
          {sentAt: sinon.match.number, status: 'sent'}));
      const expectedErrored = erroredEmails
        .map(email => genUpdateParams(email,
          {sentAt: 0, status: 'error'}));
      const expectedTotal = expectedValid.concat(expectedErrored);
      const result = await SendScheduledEmails.execute();
      expect(ScheduledEmail.update).to.have.callCount(expectedTotal.length);
      expectedTotal.forEach(expected =>
        expect(ScheduledEmail.update).to.have.been.calledWithMatch(expected));
    });
  });
});
