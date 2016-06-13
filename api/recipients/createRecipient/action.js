'use strict';

import { Recipient } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import base64url from 'base64-url';

export function respond(event, cb) {
  debug('= createRecipient.action', JSON.stringify(event));
  decrypt(event.authToken).then(() => {
    if (event.listId && event.recipient && event.recipient.email) {
      const recipient = event.recipient;
      recipient.listId = event.listId;
      recipient.id = base64url.encode(recipient.email);
      recipient.recipientStatus = recipient.recipientStatus || 'NORMAL';
      Recipient.save(recipient).then(() => {
        return cb(null, recipient);
      }).catch(e => {
        debug(e);
        return cb(e);
      });
    } else {
      return cb('No recipient specified');
    }
  })
  .catch(() => cb('403: No authentication token provided', null));
}
