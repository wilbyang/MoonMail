'use strict';

import { Link } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import { ApiErrors } from '../../lib/errors';

export function respond(event, cb) {
  debug('= getLinks.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.campaignId) {
      const options = {};
      if (event.options) {
        Object.assign(options, event.options);
      }
      Link.get(event.campaignId, null, options).then(links => {
        debug('= getLinks.action', 'Success');
        return cb(null, links);
      })
      .catch(e => {
        debug('= getLinks.action', 'Error getting links', e);
        return cb(ApiErrors.response(e));
      });
    } else {
      return cb(ApiErrors.response('No links specified'));
    }
  })
  .catch(err => cb(ApiErrors.response(err), null));
}
