'use strict';

import { debug } from '../logger';
import { Campaign } from 'moonmail-models';

class DeliverCampaignService {

  constructor(snsClient, { campaign, campaignId, userId } = {}) {
    this.snsClient = snsClient;
    this.campaign = campaign;
    this.campaignId = campaignId;
    this.userId = userId;
    this.attachRecipientsCountTopicArn = process.env.ATTACH_RECIPIENTS_COUNT_TOPIC_ARN;
  }

  sendCampaign() {
    debug('= DeliverCampaignService.sendCampaign', `Sending campaign with id ${this.campaignId}`);
    return this.getCampaign()
      .then(campaign => this.checkCampaign(campaign))
      .then(campaign => this.buildCampaignMessage(campaign))
      .then((canonicalMessage) => this.publishToSns(canonicalMessage));
  }

  getCampaign() {
    return new Promise((resolve, reject) => {
      if (this.campaign) {
        debug('= DeliverCampaignService.getCampaign', 'Updating campaign', this.campaign);
        resolve(Campaign.update(this.campaign, this.userId, this.campaignId));
      } else if (this.campaignId && this.userId) {
        debug('= DeliverCampaignService.getCampaign', `ID ${this.campaignId} and user ID ${this.userId} was provided`);
        resolve(Campaign.get(this.userId, this.campaignId));
      } else {
        debug('= DeliverCampaignService.getCampaign', 'No info provided');
        reject('No campaign info provided');
      }
    });
  }

  checkCampaign(campaign) {
    debug('= DeliverCampaignService.checkCampaign', JSON.stringify(campaign));
    return new Promise((resolve, reject) => {
      if (Campaign.isValidToBeSent(campaign)) {
        resolve(campaign);
      } else {
        reject('Campaign not ready to be sent');
      }
    });
  }

  buildCampaignMessage(campaign) {
    debug('= DeliverCampaignService.buildCampaignMessage', campaign);
    return new Promise((resolve) => {
      resolve({
        userId: campaign.userId,
        campaign: {
          id: campaign.id,
          subject: campaign.subject,
          body: campaign.body,
          senderId: campaign.senderId,
          precompiled: false,
          listIds: campaign.listIds
        }
      });
    });
  }

  publishToSns(canonicalMessage) {
    return new Promise((resolve, reject) => {
      debug('= DeliverCampaignService.publishToSns', 'Sending canonical message', JSON.stringify(canonicalMessage));
      const params = {
        Message: JSON.stringify(canonicalMessage),
        TopicArn: this.attachRecipientsCountTopicArn
      };
      this.snsClient.publish(params, (err, data) => {
        if (err) {
          debug('= DeliverCampaignService.publishToSns', 'Error sending message', err);
          reject(err);
        } else {
          debug('= DeliverCampaignService.publishToSns', 'Message sent');
          resolve(data);
        }
      });
    });
  }
}

module.exports.DeliverCampaignService = DeliverCampaignService;
