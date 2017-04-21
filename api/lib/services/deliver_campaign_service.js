import Promise from 'bluebird';
import { debug } from '../logger';
import { Campaign, List } from 'moonmail-models';
import inlineCss from 'inline-css';
import juice from 'juice';
import { compressString } from '../utils';

class DeliverCampaignService {

  constructor(snsClient, { campaign, campaignId, userId, userPlan } = {}) {
    this.snsClient = snsClient;
    this.campaign = campaign;
    this.campaignId = campaignId;
    this.userId = userId;
    this.userPlan = userPlan || 'free';
    this.sentCampaignsInMonth = 0;
    this.sentCampaignsLastDay = 0;
    this.attachRecipientsCountTopicArn = process.env.ATTACH_RECIPIENTS_COUNT_TOPIC_ARN;
    this.updateCampaignStatusTopicArn = process.env.UPDATE_CAMPAIGN_TOPIC_ARN;
  }

  sendCampaign() {
    debug('= DeliverCampaignService.sendCampaign', `Sending campaign with id ${this.campaignId}`);
    return this.checkUserQuota()
      .then(() => this._getCampaign())
      .then(campaign => this._checkCampaign(campaign))
      .then((campaign) => this._compressCampaignBody(campaign))
      .then(campaign => this._buildCampaignMessage(campaign))
      .then(canonicalMessage => this._publishToSns(canonicalMessage))
      .then(() => this._updateCampaignStatus());
  }

  checkUserQuota() {
    debug('= DeliverCampaignService._checkUserQuota', this.userId);
    return this._checkMonthlyQuota()
      .then(() => this._checkDailyQuota())
      .then(() => this._checkRecipientsLimits());
  }

  _checkMonthlyQuota() {
    return new Promise((resolve, reject) => {
      debug('= DeliverCampaignService._checkMonthlyQuota', this.userId);
      if (this.maxMonthlyCampaigns) {
        debug('= DeliverCampaignService._checkMonthlyQuota', 'User has a limit of campaigns');
        Campaign.sentLastMonth(this.userId)
          .then((count) => {
            debug('= DeliverCampaignService._checkMonthlyQuota', count);
            if (count < this.maxMonthlyCampaigns) {
              this.sentCampaignsInMonth = count;
              resolve(true);
            } else {
              reject('User can\'t send more campaigns');
            }
          });
      } else {
        debug('= DeliverCampaignService._checkMonthlyQuota', 'User has no limit of campaigns');
        resolve(true);
      }
    });
  }

  _checkDailyQuota() {
    return new Promise((resolve, reject) => {
      debug('= DeliverCampaignService._checkDailyQuota', this.userId);
      if (this.maxDailyCampaigns) {
        debug('= DeliverCampaignService._checkDailyQuota', 'User has a limit of campaigns');
        Campaign.sentLastNDays(this.userId, 1)
          .then((count) => {
            debug('= DeliverCampaignService._checkDailyQuota', count);
            if (count < this.maxDailyCampaigns) {
              this.sentCampaignsLastDay = count;
              resolve(true);
            } else {
              reject(`You can send only ${this.maxDailyCampaigns} campaigns a day`);
            }
          });
      } else {
        debug('= DeliverCampaignService._checkDailyQuota', 'User has no limit of campaigns');
        resolve(true);
      }
    });
  }

  _checkRecipientsLimits() {
    return this._getLists()
      .then(lists => this._checkRecipients(lists));
  }

  _getLists() {
    return this._getCampaign()
      .then((campaign) => {
        const listIds = campaign.listIds;
        if (listIds) {
          const getListPromises = listIds.map(listId => List.get(this.userId, listId));
          return Promise.all(getListPromises);
        }
        return Promise.resolve();
      });
  }

  _checkRecipients(lists) {
    if (lists) {
      const count = lists.reduce((accum, next) => (accum + next.subscribedCount), 0);
      if (count > this.maxRecipients) {
        return Promise.reject(`You can send campaigns up to ${this.maxRecipients} subscribers`);
      }
    }
    return Promise.resolve({});
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

  _compressCampaignBody(campaign) {
    return new Promise((resolve, reject) => {
      const compressedBody = compressString(campaign.body);
      const compressedCampaign = Object.assign({}, campaign, {body: compressedBody});
      resolve(compressedCampaign);
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
      const inlinedBody = juice(campaign.body);
      resolve({
        userId: campaign.userId,
        userPlan: this.userPlan,
        sentCampaignsInMonth: this.sentCampaignsInMonth,
        campaign: {
          id: campaign.id,
          subject: campaign.subject,
          body: inlinedBody,
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
      const campaignStatus = { campaignId: this.campaignId, userId: this.userId, status: 'pending' };
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
          resolve({ id: this.campaignId, status: 'pending' });
        }
      });
    });
  }

  get maxMonthlyCampaigns() {
    if (!this.userPlan || this.userPlan === 'free') {
      return 30;
    }
  }

  get maxDailyCampaigns() {
    if (!this.userPlan || this.userPlan === 'free') {
      return 1;
    }
  }

  get maxRecipients() {
    if (!this.userPlan || this.userPlan === 'free') {
      return 250;
    }
    if (!this.userPlan || this.userPlan === 'free_ses') {
      return 2000;
    }
    return Infinity;
  }
}

module.exports.DeliverCampaignService = DeliverCampaignService;
