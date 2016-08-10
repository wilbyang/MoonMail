'use strict';

import { EmailTemplate } from 'moonmail-models';
import { debug } from '../../lib/logger';
import cuid from 'cuid';
import decrypt from '../../lib/auth-token-decryptor';
import { ApiErrors } from '../../lib/errors';

export function respond(event, cb) {
  debug('= createTemplate.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.template) {
      let template = event.template;
      template.userId = decoded.sub;
      template.id = cuid();
      EmailTemplate.save(template).then(() => {
        return cb(null, template);
      }).catch(e => {
        debug(e);
        return cb(ApiErrors.response(e));
      });
    } else {
      return cb(ApiErrors.response('No template specified'));
    }
  })
  .catch(err => cb(ApiErrors.response(err), null));
}
