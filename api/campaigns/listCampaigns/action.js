'use strict';

import { Campaign } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import { ApiErrors } from '../../lib/errors';

export function respond(event, cb) {
  debug('= listCampaigns.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    const options = {
      limit: 10
    };
    if (event.options) {
      Object.assign(options, event.options);
    }
    Campaign.allBy('userId', decoded.sub, options).then(campaigns => {
      debug('= listCampaigns.action', 'Success');
      return cb(null, campaigns);
    })
    .catch(e => {
      debug('= listCampaigns.action', e);
      return cb(ApiErrors.response(e));
    });
  })
  .catch(err => cb(ApiErrors.response(err), null));
}
