'use strict';

import { Campaign } from 'moonmail-models';
import { debug } from '../../lib/logger';
import cuid from 'cuid';
import decrypt from '../../lib/auth-token-decryptor';

export function respond(event, cb) {
  debug('= createCampaign.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.campaign) {
      let campaign = event.campaign;
      campaign.userId = decoded.sub;
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
  })
  .catch(err => cb('403: No authentication token provided', null));
}
