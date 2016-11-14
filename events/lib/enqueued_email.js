'use strict';

import { debug } from './index';
import mailcomposer from 'mailcomposer';

class EnqueuedEmail {
  constructor(message, receiptHandle, messageId) {
    this.message = message;
    this.receiptHandle = receiptHandle;
    this.messageId = messageId;
  }

  toSesParams() {
    return {
      Destination: {
        ToAddresses: [this.message.recipient.email]
      },
      Message: {
        Body: {
          Html: { Data: this.message.campaign.body }
        },
        Subject: { Data: this.message.campaign.subject }
      },
      Source: this.composeFromPart()
    };
  }

  toSesRawParams() {
    return new Promise((resolve, reject) => {
      const mailOptions = {
        from: this.composeFromPart(),
        subject: this.message.campaign.subject,
        html: this.message.campaign.body,
        to: this.message.recipient.email,
        headers: [{key: 'List-Unsubscribe', value: this._listUnsubscribeHeaderValue()}]
      };
      const mail = mailcomposer(mailOptions);
      mail.build((err, message) => {
        if (err) return reject(err);
        else return resolve({RawMessage: {Data: message}});
      });
    });
  }

  _listUnsubscribeHeaderValue() {
    if (this.message.recipient.unsubscribeUrl) {
      return `<${this.message.recipient.unsubscribeUrl}>`;
    }
  }

  toSentEmail(messageId) {
    return {
      messageId,
      recipientId: this.message.recipient.id,
      campaignId: this.message.campaign.id,
      email: this.message.recipient.email,
      listId: this.message.recipient.listId,
      status: 'sent'
    };
  }

  composeFromPart() {
    const name = this.message.sender.fromName;
    const email = this.message.sender.emailAddress;
    if (name) {
      return `"${name}" <${email}>`;
    }
    return email;
  }

  getEmailUserId() {
    return this.message.userId;
  }

}

module.exports.EnqueuedEmail = EnqueuedEmail;
