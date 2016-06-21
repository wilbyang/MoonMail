'use strict';

import { Recipient } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import { ApiErrors } from '../../lib/errors';

export function respond(event, cb) {
  debug('= updateRecipient.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.listId && event.recipientId && event.recipient) {
      delete event.recipient.email;
      Recipient.update(event.recipient, event.listId, event.recipientId).then(recipient => {
        debug('= updateRecipient.action', 'Success');
        return cb(null, recipient);
      })
      .catch(e => {
        debug('= updateRecipient.action', e);
        return cb(ApiErrors.response(e));
      });
    } else {
      return cb(ApiErrors.response('No recipient specified'));
    }
  })
  .catch(err => cb(ApiErrors.response(err), null));
}
