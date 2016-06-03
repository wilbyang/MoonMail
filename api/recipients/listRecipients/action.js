'use strict';

import { Recipient } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';

export function respond(event, cb) {
  debug('= listRecipients.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.listId) {
      let options = {};
      if (event.nextPage) {
        options.nextPage = event.nextPage;
      }
      Recipient.allBy('listId', event.listId, options).then(recipient => {
        debug('= listRecipients.action', 'Success');
        return cb(null, recipient);
      })
      .catch(e => {
        debug('= listRecipients.action', e);
        return cb(e);
      });
    } else {
      return cb('No list provided');
    }
  })
  .catch(err => cb('403: No authentication token provided', null));
}
