'use strict';

import { Campaign } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import { ApiErrors } from '../../lib/errors';

export function respond(event, cb) {
  debug('= listCampaigns.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    let options = {
        limit: 25
      };
    if (event.nextPage) {
      options.nextPage = event.nextPage;
    }
    Campaign.allBy('userId', decoded.sub, options).then(campaigns => {
      debug('= listCampaigns.action', 'Success');
      return cb(null, campaigns);
    })
    .catch(e => {
      debug('= listCampaigns.action', e);
      return cb(e);
    });
  })
  .catch(err => cb(ApiErrors.response(err), null));
}
