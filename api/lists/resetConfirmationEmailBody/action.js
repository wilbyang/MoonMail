import * as fs from 'fs';
import { List } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import { ApiErrors } from '../../lib/errors';

export function respond(event, cb) {
  debug('= resetConfirmationEmailBody.action', JSON.stringify(event));
  decrypt(event.authToken)
    .then((decoded) => {
      if (event.listId) {
        List.update({confirmationEmailBody: defaultConfirmationEmailBody()}, decoded.sub, event.listId)
          .then((list) => {
            debug('= resetConfirmationEmailBody.action', 'Success');
            return cb(null, list);
          })
          .catch((e) => {
            debug('= resetConfirmationEmailBody.action', e);
            return cb(ApiErrors.response(e));
          });
      } else {
        return cb(ApiErrors.response('No list specified'));
      }
    })
    .catch(err => cb(ApiErrors.response(err), null));
}

export function defaultConfirmationEmailBody() {
  const file = 'lists/getEmailList/templates/default_email_confirmation.html';
  return fs.readFileSync(file, 'utf8');
}
