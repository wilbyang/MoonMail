'use strict';

import { Campaign } from 'moonmail-models';
import { debug } from '../../lib/logger';

export function respond(event, cb) {
  debug('= deleteCampaign.action', JSON.stringify(event));
  if (event.userId && event.campaignId) {
    Campaign.delete(event.userId, event.campaignId).then(result => {
      debug('= deleteCampaign.action', 'Success');
      return cb(null, result);
    })
    .catch(e => {
      debug('= deleteCampaign.action', e);
      return cb(e);
    });
  } else {
    return cb('No user specified');
  }
}
