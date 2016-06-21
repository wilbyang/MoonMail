'use strict';

import { List } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import ApiErrors from '../../lib/errors';

export function respond(event, cb) {
  debug('= getEmailList.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.listId) {
      const options = {};
      if (event.options) {
        Object.assign(options, event.options);
      }
      List.get(decoded.sub, event.listId, options).then(list => {
        debug('= getEmailList.action', 'Success');
        return cb(null, list);
      })
      .catch(e => {
        debug('= getEmailList.action', 'Error getting list', e);
        return cb(ApiErrors.response(e));
      });
    } else {
      return cb('No list specified');
    }
  })
  .catch(err => cb(ApiErrors.response(err), null));
}
