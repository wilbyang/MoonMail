'use strict';

import { Campaign } from '../../lib/models/campaign';
import { debug } from '../../lib/logger';

export function respond(event, cb) {
  debug('= listCampaigns.action', JSON.stringify(event));
  if (event.userId) {
    Campaign.allBy('userId', event.userId).then(campaigns => {
      debug('= listCampaigns.action', 'Success');
      return cb(null, campaigns);
    })
    .catch(e => {
      debug(e);
      return cb(e);
    });
  } else {
    return cb('No user specified');
  }
}
