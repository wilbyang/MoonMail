'use strict';

import { Campaign } from 'moonmail-models';
import { debug } from '../../lib/logger';

export function respond(event, cb) {
  debug('= listCampaigns.action', JSON.stringify(event));
  if (event.userId) {
    let options = {};
    if (event.nextPage) {
      options.nextPage = event.nextPage;
    }
    Campaign.allBy('userId', event.userId, options).then(campaigns => {
      debug('= listCampaigns.action', 'Success');
      return cb(null, campaigns);
    })
    .catch(e => {
      debug('= listCampaigns.action', e);
      return cb(e);
    });
  } else {
    return cb('No user specified');
  }
}
