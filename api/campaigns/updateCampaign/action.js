'use strict';

import { Campaign } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';

export function respond(event, cb) {
  debug('= updateCampaign.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.campaign && event.campaignId) {
      Campaign.update(event.campaign, decoded.sub, event.campaignId).then(campaign => {
        debug('= updateCampaign.action', 'Success');
        return cb(null, campaign);
      })
      .catch(e => {
        debug('= updateCampaign.action', e);
        return cb(e);
      });
    } else {
      return cb('No campaign specified');
    }
  })
  .catch(err => cb('403: No authentication token provided', null));
}
