'use strict';

import { Campaign } from 'moonmail-models';
import { debug } from '../../lib/logger';

export function respond(event, cb) {
  debug('= getCampaign.action', JSON.stringify(event));
  if (event.userId && event.campaignId) {
    Campaign.get(event.userId, event.campaignId).then(campaign => {
      debug('= getCampaign.action', 'Success');
      return cb(null, campaign);
    })
    .catch(e => {
      debug('= getCampaign.action', 'Error getting campaign', e);
      return cb(e);
    });
  } else {
    return cb('No campaign specified');
  }
}
