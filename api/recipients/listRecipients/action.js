import { Recipient } from 'moonmail-models';
import omitEmpty from 'omit-empty';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import { ApiErrors } from '../../lib/errors';

export function respond(event, cb) {
  debug('= listRecipients.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.listId) {
      const options = {
        limit: 10
      };
      if (event.options) {
        Object.assign(options, omitEmpty(event.options));
      }
      let servicePromise;
      if (!!event.email) servicePromise = Recipient.emailBeginsWith(event.listId, event.email, options);
      else if (!!event.status) servicePromise = Recipient.allByStatus(event.listId, event.status, options);
      else servicePromise = Recipient.allBy('listId', event.listId, options);
      servicePromise.then(recipients => {
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
