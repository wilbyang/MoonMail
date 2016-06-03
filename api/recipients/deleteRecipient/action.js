'use strict';

import { Recipient } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';

export function respond(event, cb) {
  debug('= deleteRecipient.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.listId && event.recipientId) {
      Recipient.delete(event.listId, event.recipientId).then(result => {
        debug('= deleteRecipient.action', 'Success');
        return cb(null, result);
      })
      .catch(e => {
        debug('= deleteRecipient.action', e);
        return cb(e);
      });
    } else {
      return cb('No recipient specified');
    }
  })
  .catch(err => cb('403: No authentication token provided', null));
}
