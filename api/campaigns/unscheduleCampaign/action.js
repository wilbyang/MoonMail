'use strict';

import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import { Campaign } from 'moonmail-models';
import { ApiErrors } from '../../lib/errors';

export function respond(event, cb) {
  debug('= unscheduleCampaign.action', JSON.stringify(event));
  decrypt(event.authToken)
    .then(decoded => {
      if (event.campaignId) {
        return Campaign.cancelSchedule(decoded.sub, event.campaignId)
          .then(res => cb(null, res))
          .catch(err => cb(ApiErrors.response(err)));
      } else {
        return cb(ApiErrors.response('Missing params'));
      }
    })
    .catch(err => cb(ApiErrors.response(err), null));
}
