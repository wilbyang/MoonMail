'use strict';

import { List } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import ApiErrors from '../../lib/errors';
import * as fs from 'fs';

export function respond(event, cb) {
  debug('= getEmailList.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.listId) {
      const options = {};
      if (event.options) {
        Object.assign(options, event.options);
      }
      List.get(decoded.sub, event.listId, options).then(list => {
        debug('= getEmailList.action', 'Success');
        if (!isConfirmationBodyExcluded(options) && !list.confirmationEmailBody) {
          list.confirmationEmailBody = defaultConfirmationEmailBody();
        }
        return cb(null, list);
      })
      .catch(e => {
        debug('= getEmailList.action', 'Error getting list', e);
        return cb(ApiErrors.response(e));
      });
    } else {
      return cb('No list specified');
    }
  })
  .catch(err => cb(ApiErrors.response(err), null));
}

function defaultConfirmationEmailBody() {
  const file = 'lists/getEmailList/templates/default_email_confirmation.html';
  return fs.readFileSync(file, 'utf8');
}

function isConfirmationBodyExcluded(options) {
  const fieldRegex = /confirmationEmailBody/;
  return (options.include_fields === 'true' && !options.fields.match(fieldRegex)) ||
    (options.include_fields === 'false' && options.fields.match(fieldRegex));
}
