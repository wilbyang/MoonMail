'use strict';

import { EmailTemplate } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import { ApiErrors } from '../../lib/errors';

export function respond(event, cb) {
  debug('= getTemplate.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.templateId) {
      const options = {};
      if (event.options) {
        Object.assign(options, event.options);
      }
      EmailTemplate.get(decoded.sub, event.templateId, options).then(emailTemplate => {
        debug('= getTemplate.action', 'Success');
        return cb(null, emailTemplate);
      })
      .catch(e => {
        console.log('= getTemplate.action', 'Error getting email template', e);
        return cb(ApiErrors.response(e));
      });
    } else {
      return cb(ApiErrors.response('No template specified'));
    }
  })
  .catch(err => cb(ApiErrors.response(err), null));
}
