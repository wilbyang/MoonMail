'use strict';

import { debug } from './index';
import { Campaign } from './models/campaign';

class SendCampaignService {

  constructor(campaignId) {
    this.campaignId = campaignId;
  }

  sendCampaign() {
    return null;
  }

  buildCampaignMessage(campaignRecord) {
    return new Promise((resolve) => {
      resolve({
        userId: campaignRecord.userId,
        campaign: {
          id: campaignRecord.id,
          subject: campaignRecord.subject,
          body: campaignRecord.body,
          senderId: campaignRecord.senderId,
          precompiled: false
        },
        listIds: campaignRecord.listIds
      });
    });
  }
}

module.exports.SendCampaignService = SendCampaignService;
