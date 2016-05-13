'use strict';

import { Campaign } from 'moonmail-models';
import { debug } from '../../lib/logger';

export function respond(event, cb) {
  debug('= updateCampaign.action', JSON.stringify(event));
  if (event.userId && event.campaign) {
    Campaign.update(event.campaign, event.userId, event.campaign.id).then(campaign => {
      debug('= updateCampaign.action', 'Success');
      return cb(null, campaign);
    })
    .catch(e => {
      debug('= updateCampaign.action', e);
      return cb(e);
    });
  } else {
    return cb('No user specified');
  }
}
