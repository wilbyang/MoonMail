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

  notifyAttachListRecipients() {
    debug('= AttachRecipientsService.attachAllRecipients', this.listIds);
    const attachListPromises = this.listIds.map(listId => this._notifyAttachListRecipients(this._buildAttachListRecipientsMessage(listId)));
    return Promise.all(attachListPromises)
      .then(() => this._wait(5000))
      .then(() => this._notifyToUpdateCampaignStatus())
      .then(() => this._notifyToSendEmails());
  }

  _buildAttachListRecipientsMessage(listId) {
    return {
      sender: this.campaignMessage.sender,
      campaign: this.campaignMessage.campaign,
      userId: this.campaignMessage.userId,
      userPlan: this.campaignMessage.userPlan || 'free',
      listId
    };
  }

  // Fanout
  _notifyAttachListRecipients(attachListRecipientsMessage) {
    debug('= AttachRecipientsService._notifyAttachListRecipients', JSON.stringify(attachListRecipientsMessage));
    return new Promise((resolve, reject) => {
      const params = {
        TopicArn: process.env.ATTACH_LIST_RECIPIENTS_TOPIC_ARN,
        Message: JSON.stringify(attachListRecipientsMessage)
      };
      this.snsClient.publish(params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          debug('= AttachRecipientsService._notifyAttachListRecipients', 'Message sent');
          resolve(result);
        }
      });
    });
  }

  _notifyToUpdateCampaignStatus() {
    debug('= AttachRecipientsService._notifyToUpdateCampaignStatus', JSON.stringify(this.campaignMessage));
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

  _notifyToSendEmails() {
    debug('= AttachRecipientsService._notifyToSendEmails', JSON.stringify(this.campaignMessage));
    return new Promise((resolve, reject) => {
      const snsParams = {
        TopicArn: process.env.SEND_EMAILS_TOPIC_ARN,
        Message: JSON.stringify({ QueueName: this.campaignMessage.userId.replace('|', '_') })
      };
      this.snsClient.publish(snsParams, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  _wait(time) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }
}

module.exports.AttachRecipientsService = AttachRecipientsService;
