'use strict';

import { debug } from './index';

class SendCampaignService {

  constructor() {
  }

  buildCampaignObject() {
    return new Promise((resolve, reject) => {
      resolve({
        userId: 'ca7654',
        campaign: {
          id: 'ca213',
          subject: 'my campaign subject',
          body: 'my campaign body',
          senderId: 'ca654',
          precompiled: false
        },
        listIds: ['ca43546']
      });
    });
  }
}

module.exports.SendCampaignService = SendCampaignService;
