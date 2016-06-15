'use strict';

import { Campaign } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import { ApiErrors } from '../../lib/errors';

export function respond(event, cb) {
  debug('= getCampaign.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.campaignId) {
      const options = {};
      if (event.options && event.options.attributes) {
        options.attributes = event.options.attributes.split(',');
      }
      Campaign.get(decoded.sub, event.campaignId, options).then(campaign => {
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
  .catch(err => cb(ApiErrors.response(err), null));
}
