'use strict';

import { List } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';

export function respond(event, cb) {
  debug('= listEmailLists.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    let options = {};
    if (event.nextPage) {
      options.nextPage = event.nextPage;
    }
    List.allBy('userId', decoded.sub, options).then(list => {
      debug('= listEmailLists.action', 'Success');
      return cb(null, list);
    })
    .catch(e => {
      debug('= listEmailLists.action', e);
      return cb(e);
    });
  })
  .catch(err => cb('403: No authentication token provided', null));
}
