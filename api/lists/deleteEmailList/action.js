'use strict';

import { List } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';

export function respond(event, cb) {
  debug('= deleteEmailList.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.listId) {
      List.delete(decoded.sub, event.listId).then(result => {
        debug('= deleteEmailList.action', 'Success');
        return cb(null, result);
      })
      .catch(e => {
        debug('= deleteEmailList.action', e);
        return cb(e);
      });
    } else {
      return cb('No list specified');
    }
  })
  .catch(err => cb('403: No authentication token provided', null));
}
