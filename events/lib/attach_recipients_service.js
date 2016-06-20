'use strict';

import { debug } from './index';
import { Recipient } from 'moonmail-models';
import * as async from 'async';

class AttachRecipientsService {
  constructor(snsClient, campaignMessage) {
    this.snsClient = snsClient;
    this.campaignMessage = campaignMessage;
    this.listIds = campaignMessage.campaign.listIds;
  }

  attachAllRecipients() {
    debug('= AttachRecipientsService.attachAllRecipients', this.listIds);
    const attachListPromises = this.listIds.map(listId => this.attachRecipientsList(listId));
    return Promise.all(attachListPromises).then(() => this._notifySent());
  }

  attachRecipientsList(listId, nextPage = {}) {
    debug('= AttachRecipientsService.attachRecipientsList', listId);
    return this._attachRecipientsBatch(listId, nextPage)
      .then(nextPage => this._attachNextBatch(listId, nextPage));
  }

  _attachRecipientsBatch(listId, options = {}) {
    debug('= AttachRecipientsService._attachRecipientsBatch', listId, JSON.stringify(options));
    return new Promise((resolve, reject) => {
      const next = {};
      this._getRecipientsBatch(listId, options)
        .then(result => {
          if (result.nextPage) {
            next.nextPage = result.nextPage;
          }
          return this._publishRecipients(result.items);
        })
        .then(() => resolve(next));
    });
  }

  _attachNextBatch(listId, next) {
    return new Promise((resolve, reject) => {
      if (next && next.hasOwnProperty('nextPage')) {
        debug('= AttachRecipientsService._attachNextBatch', 'Attaching next batch', JSON.stringify(next));
        resolve(this.attachRecipientsList(listId, next));
      } else {
        debug('= AttachRecipientsService._attachNextBatch', 'No more batches');
        resolve(true);
      }
    });
  }

  _getRecipientsBatch(listId, options = {}) {
    debug('= AttachRecipientsService.attachRecipients', `Getting recipients for ${listId}`);
    const subscribedCondition = {conditions: {eq: {status: Recipient.statuses.subscribed}}};
    const recipientOptions = Object.assign(options, subscribedCondition);
    recipientOptions.limit = 250;
    return Recipient.allBy('listId', listId, recipientOptions);
  }

  _publishRecipients(recipients) {
    debug('= AttachRecipientsService._publishRecipients', 'Publishing a batch of recipients');
    return new Promise((resolve) => {
      async.each(recipients, (recipient, cb) => {
        this._publishRecipient(recipient)
          .then(() => cb())
          .catch(err => {
            debug('= AttachRecipientsService._publishRecipients',
              'Couldn\'t publish recipient', JSON.stringify(recipient), err);
            cb();
          });
      }, () => resolve(true));
    });
  }

  _publishRecipient(recipient) {
    debug('= AttachRecipientsService._publishRecipient', JSON.stringify(recipient));
    return new Promise((resolve, reject) => {
      const recipientMessage = this._buildRecipientMessage(recipient);
      const params = {
        TopicArn: process.env.PRECOMPILE_EMAIL_TOPIC_ARN,
        Message: JSON.stringify(recipientMessage)
      };
      this.snsClient.publish(params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  _notifySent() {
    debug('= AttachRecipientsService._notifySent', JSON.stringify(this.campaignMessage));
    return new Promise((resolve, reject) => {
      const campaignStatus = {
        status: 'sent',
        campaignId: this.campaignMessage.campaign.id,
        userId: this.campaignMessage.userId
      };
      const params = {
        TopicArn: process.env.UPDATE_CAMPAIGN_TOPIC_ARN,
        Message: JSON.stringify(campaignStatus)
      };
      this.snsClient.publish(params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  _buildRecipientMessage(recipient) {
    debug('= AttachRecipientsService._buildRecipientMessage', JSON.stringify(recipient));
    return Object.assign({}, this.campaignMessage, {recipient});
  }
}

module.exports.AttachRecipientsService = AttachRecipientsService;
