'use strict';

import { EmailTemplate } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import { ApiErrors } from '../../lib/errors';

export function respond(event, cb) {
  debug('= deleteTemplate.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.templateId) {
      EmailTemplate.delete(decoded.sub, event.templateId).then(result => {
        debug('= deleteTemplate.action', 'Success');
        return cb(null, result);
      })
      .catch(e => {
        debug('= deleteTemplate.action', e);
        return cb(ApiErrors.response(e));
      });
    } else {
      return cb(ApiErrors.response('No template specified'));
    }
  })
  .catch(err => cb(ApiErrors.response(err), null));
}
