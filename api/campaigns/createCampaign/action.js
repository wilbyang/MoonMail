'use strict';

import { Campaign } from 'moonmail-models';
import { debug } from '../../lib/logger';
import cuid from 'cuid';

export function respond(event, cb) {
  debug('= createCampaign.action', JSON.stringify(event));
  if (event.campaign && event.userId) {
    let campaign = event.campaign;
    campaign.userId = event.userId;
    campaign.id = cuid();
    Campaign.save(campaign).then(campaign => {
      return cb(null, campaign);
    }).catch( e => {
      debug(e);
      return cb(e);
    });
  } else {
    return cb('No campaign specified');
  }
}
