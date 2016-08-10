'use strict';

import { EmailTemplate } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import { ApiErrors } from '../../lib/errors';

export function respond(event, cb) {
  debug('= updateTemplate.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.template && event.templateId) {
      EmailTemplate.update(event.template, decoded.sub, event.templateId).then(template => {
        debug('= updateTemplate.action', 'Success');
        return cb(null, template);
      })
      .catch(e => {
        debug('= updateTemplate.action', e);
        return cb(ApiErrors.response(e));
      });
    } else {
      return cb(ApiErrors.response('No template specified'));
    }
  })
  .catch(err => cb(ApiErrors.response(err), null));
}
