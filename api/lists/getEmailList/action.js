'use strict';

import { List } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';

export function respond(event, cb) {
  debug('= getEmailList.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.listId) {
      List.get(decoded.sub, event.listId).then(list => {
        debug('= getEmailList.action', 'Success');
        return cb(null, list);
      })
      .catch(e => {
        debug('= getEmailList.action', 'Error getting list', e);
        return cb(e);
      });
    } else {
      return cb('No list specified');
    }
  })
  .catch(err => cb('403: No authentication token provided', null));
}
