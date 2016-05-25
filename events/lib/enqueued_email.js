'use strict';

import { debug } from './index';


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
      Source: this.message.sender.emailAddress
    };
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

}

module.exports.EnqueuedEmail = EnqueuedEmail;
