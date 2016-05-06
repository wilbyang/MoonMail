'use strict';

import { debug } from './index';
import { Campaign } from './models/campaign';

class SendCampaignService {

  constructor(campaignId) {
    this.campaignId = campaignId;
  }

  sendCampaign() {
    return this.getCampaign()
      .then((campaignRecord) => this.buildCampaignMessage(campaignRecord.Item));
  }

  getCampaign() {
    debug('= SendCampaignService.getCampaign', this.campaignId);
    return Campaign.get(this.campaignId);
  }

  buildCampaignMessage(campaign) {
    debug('= SendCampaignService.buildCampaignMessage', campaign);
    return new Promise((resolve) => {
      resolve({
        userId: campaign.userId,
        campaign: {
          id: campaign.id,
          subject: campaign.subject,
          body: campaign.body,
          senderId: campaign.senderId,
          precompiled: false
        },
        listIds: campaign.listIds
      });
    });
  }
}

module.exports.SendCampaignService = SendCampaignService;
