'use strict';

import { Recipient } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import { ApiErrors } from '../../lib/errors';

export function respond(event, cb) {
  debug('= bulkDeleteRecipients.action', JSON.stringify(event));
  decrypt(event.authToken).then(decoded => {
    if (event.listId && event.recipientIds) {
      const recipientsKeys = event.recipientIds.split(',')
        .map(recipientId => [event.listId, recipientId]);
      Recipient.deleteAll(recipientsKeys).then(result => {
        debug('= bulkDeleteRecipients.action', 'Success');
        return cb(null, result);
      })
      .catch(e => {
        debug('= bulkDeleteRecipients.action', e);
        return cb(ApiErrors.response(e));
      });
    } else {
      return cb(ApiErrors.response('No recipient specified'));
    }
  })
  .catch(err => cb(ApiErrors.response(err), null));
}
