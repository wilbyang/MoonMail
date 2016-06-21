'use strict';

import { Recipient } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import { ApiErrors } from '../../lib/errors';
import omitEmpty from 'omit-empty';

export function respond(event, cb) {
  debug('= listRecipients.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.listId) {
      let options = {
        limit: 25
      };
      if (event.options) {
        Object.assign(options, omitEmpty(event.options));
      }
      Recipient.allBy('listId', event.listId, options).then(recipients => {
        debug('= listRecipients.action', 'Success');
        return cb(null, recipients);
      })
      .catch(e => {
        debug('= listRecipients.action', e);
        return cb(ApiErrors.response(e));
      });
    } else {
      return cb(ApiErrors.response('No list provided'));
    }
  })
  .catch(err => cb(ApiErrors.response(err), null));
}
