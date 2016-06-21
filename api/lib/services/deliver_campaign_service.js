'use strict';

import { debug } from '../logger';
import { Campaign } from 'moonmail-models';

class DeliverCampaignService {

  constructor(snsClient, { campaign, campaignId, userId, userPlan } = {}) {
    this.snsClient = snsClient;
    this.campaign = campaign;
    this.campaignId = campaignId;
    this.userId = userId;
    this.userPlan = userPlan;
    this.sentCampaignsInMonth = 0;
    this.attachRecipientsCountTopicArn = process.env.ATTACH_RECIPIENTS_COUNT_TOPIC_ARN;
    this.updateCampaignStatusTopicArn = process.env.ATTACH_RECIPIENTS_COUNT_TOPIC_ARN;
  }

  sendCampaign() {
    debug('= DeliverCampaignService.sendCampaign', `Sending campaign with id ${this.campaignId}`);
    return this._checkUserQuota()
      .then(() => this._getCampaign())
      .then(campaign => this._checkCampaign(campaign))
      .then(campaign => this._buildCampaignMessage(campaign))
      .then((canonicalMessage) => this._publishToSns(canonicalMessage))
      .then(() => this._updateCampaignStatus());
  }

  _checkUserQuota() {
    return new Promise((resolve, reject) => {
      debug('= DeliverCampaignService._checkUserQuota', this.userId);
      if (this.maxMonthlyCampaigns) {
        debug('= DeliverCampaignService._checkUserQuota', 'User has a limit of campaigns');
        Campaign.sentLastMonth(this.userId)
          .then(count => {
            debug('= DeliverCampaignService._checkUserQuota', count);
            if (count < this.maxMonthlyCampaigns) {
              this.sentCampaignsInMonth = count;
              resolve(true);
            } else {
              reject('User can\'t send more campaigns');
            }
          });
      } else {
        debug('= DeliverCampaignService._checkUserQuota', 'User has no limit of campaigns');
        resolve(true);
      }
    });
  }

  _getCampaign() {
    return new Promise((resolve, reject) => {
      if (this.campaign) {
        debug('= DeliverCampaignService._getCampaign', 'Updating campaign', this.campaign);
        resolve(Campaign.update(this.campaign, this.userId, this.campaignId));
      } else if (this.campaignId && this.userId) {
        debug('= DeliverCampaignService._getCampaign', `ID ${this.campaignId} and user ID ${this.userId} was provided`);
        resolve(Campaign.get(this.userId, this.campaignId));
      } else {
        debug('= DeliverCampaignService._getCampaign', 'No info provided');
        reject('No campaign info provided');
      }
    });
  }

  _checkCampaign(campaign) {
    debug('= DeliverCampaignService._checkCampaign', JSON.stringify(campaign));
    return new Promise((resolve, reject) => {
      if (Campaign.isValidToBeSent(campaign)) {
        resolve(campaign);
      } else {
        reject('Campaign not ready to be sent');
      }
    });
  }

  _buildCampaignMessage(campaign) {
    debug('= DeliverCampaignService._buildCampaignMessage', campaign);
    return new Promise((resolve) => {
      resolve({
        userId: campaign.userId,
        userPlan: this.userPlan,
        sentCampaignsInMonth: this.sentCampaignsInMonth,
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

  _publishToSns(canonicalMessage) {
    return new Promise((resolve, reject) => {
      debug('= DeliverCampaignService._publishToSns', 'Sending canonical message', JSON.stringify(canonicalMessage));
      const params = {
        Message: JSON.stringify(canonicalMessage),
        TopicArn: this.attachRecipientsCountTopicArn
      };
      this.snsClient.publish(params, (err, data) => {
        if (err) {
          debug('= DeliverCampaignService._publishToSns', 'Error sending message', err);
          reject(err);
        } else {
          debug('= DeliverCampaignService._publishToSns', 'Message sent');
          resolve(data);
        }
      });
    });
  }

  _updateCampaignStatus() {
    return new Promise((resolve, reject) => {
      debug('= DeliverCampaignService._updateCampaignStatus');
      const campaignStatus = {campaignId: this.campaignId, userId: this.userId, status: 'pending'};
      const params = {
        Message: JSON.stringify(campaignStatus),
        TopicArn: this.updateCampaignStatusTopicArn
      };
      this.snsClient.publish(params, (err, data) => {
        if (err) {
          debug('= DeliverCampaignService._updateCampaignStatus', 'Error sending message', err);
          reject(err);
        } else {
          debug('= DeliverCampaignService._updateCampaignStatus', 'Message sent');
          resolve({id: this.campaignId, status: 'pending'});
        }
      });
    });
  }

  get maxMonthlyCampaigns() {
    if (this.userPlan === 'free') {
      return 5;
    }
  }
}

module.exports.DeliverCampaignService = DeliverCampaignService;
