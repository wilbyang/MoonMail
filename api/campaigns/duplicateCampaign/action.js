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
      Campaign.get(decoded.sub, event.campaignId).then((campaign) => {
        let newCampaign = Object.assign({}, campaign);
        newCampaign.name = `${campaign.name} copy`;
        delete newCampaign.id;
        return newCampaign;
      }).then((campaign) => {
        return Campaign.save(campaign);
      }).then((campaign) => {
        return cb(null, campaign);
      }).catch(e => {
        debug(e);
        return cb(ApiErrors.response(e));
      });
    } else {
      return cb(ApiErrors.response('No campaign specified'));
    }
  }).catch(err => cb(ApiErrors.response(err), null));
}
