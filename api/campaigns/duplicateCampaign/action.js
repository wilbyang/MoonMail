'use strict';

import { Campaign } from 'moonmail-models';
import { debug } from '../../lib/logger';
import cuid from 'cuid';
import decrypt from '../../lib/auth-token-decryptor';
import { ApiErrors } from '../../lib/errors';

export function respond(event, cb) {
  debug('= duplicateCampaign.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.campaignId) {
      Campaign.get(decoded.sub, event.campaignId).then((existingCampaign) => {
        let campaign = Object.assign({}, existingCampaign);
        campaign.id = cuid();
        campaign.userId = decoded.sub;
        campaign.status = 'draft';
        campaign.name = `${existingCampaign.name} copy`;

        Campaign.save(campaign).then(() => {
          return cb(null, campaign);
        }).catch(e => {
          debug(e);
          return cb(ApiErrors.response(e));
        });
      }).catch(e => {
        debug('= getCampaign.action', 'Error getting campaign', e);
        return cb(ApiErrors.response(e));
      });
    } else {
      return cb(ApiErrors.response('No campaign specified'));
    }
  }).catch(err => cb(ApiErrors.response(err), null));
}
