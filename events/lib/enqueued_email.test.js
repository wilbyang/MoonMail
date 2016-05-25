'use strict';

import * as chai from 'chai';
const chaiAsPromised = require('chai-as-promised');
const chaiThings = require('chai-things');
import { expect } from 'chai';
import { EnqueuedEmail } from './enqueued_email';
import * as sqsMessages from './sqs_receive_messages_response.json';

chai.use(chaiAsPromised);
chai.use(chaiThings);

describe('EnqueuedEmail', () => {
  let email;

  before(() => {
    email = new EnqueuedEmail(JSON.parse(sqsMessages.Messages[0].Body), 'some_handler');
  });

  describe('#toSesParams()', () => {
    it('builds SES params', (done) => {
      const sesEmail = email.toSesParams();
      expect(sesEmail).to.have.property('Source', email.message.sender.emailAddress);
      expect(sesEmail).to.have.deep.property('Destination.ToAddresses');
      expect(sesEmail).to.have.deep.property('Message.Body.Html.Data', email.message.campaign.body);
      expect(sesEmail).to.have.deep.property('Message.Subject.Data', email.message.campaign.subject);
      done();
    });
  });

  describe('#toSentEmail()', () => {
    it('builds SentEmail params', (done) => {
      const messageId = 'my-message-id';
      const sesEmail = email.toSentEmail(messageId);
      expect(sesEmail).to.have.property('messageId', messageId);
      expect(sesEmail).to.have.property('recipientId', email.message.recipient.id);
      expect(sesEmail).to.have.property('campaignId', email.message.campaign.id);
      expect(sesEmail).to.have.property('email', email.message.recipient.email);
      expect(sesEmail).to.have.property('listId', email.message.recipient.listId);
      expect(sesEmail).to.have.property('status', 'sent');
      done();
    });
  });
});
