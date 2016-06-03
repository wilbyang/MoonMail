'use strict';

import { Recipient } from 'moonmail-models';
import { debug } from '../../lib/logger';
import cuid from 'cuid';
import decrypt from '../../lib/auth-token-decryptor';

export function respond(event, cb) {
  debug('= createRecipient.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.listId && event.recipient) {
      let recipient = event.recipient;
      recipient.listId = event.listId;
      recipient.id = cuid();
      recipient.recipientStatus = recipient.recipientStatus || 'NORMAL';
      Recipient.save(recipient).then(recipient => {
        return cb(null, recipient);
      }).catch( e => {
        debug(e);
        return cb(e);
      });
    } else {
      return cb('No recipient specified');
    }
  })
  .catch(err => cb('403: No authentication token provided', null));
}
