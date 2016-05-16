'use strict';

import { Campaign } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';

export function respond(event, cb) {
  debug('= getCampaign.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.campaignId) {
      Campaign.get(decoded.sub, event.campaignId).then(campaign => {
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
  })
  .catch(err => cb('403: No authentication token provided', null));
}
