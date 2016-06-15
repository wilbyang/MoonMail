'use strict';

import { Recipient } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import { ApiErrors } from '../../lib/errors';

export function respond(event, cb) {
  debug('= getRecipient.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.listId && event.recipientId) {
      Recipient.get(event.listId, event.recipientId).then(recipient => {
        debug('= getRecipient.action', 'Success');
        return cb(null, recipient);
      })
      .catch(e => {
        debug('= getRecipient.action', 'Error getting recipient', e);
        return cb(e);
      });
    } else {
      return cb('No recipient specified');
    }
  })
  .catch(err => cb(ApiErrors.response(err), null));
}
