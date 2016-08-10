'use strict';

import { EmailTemplate } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import { ApiErrors } from '../../lib/errors';
import omitEmpty from 'omit-empty';

export function respond(event, cb) {
  debug('= listTemplates.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    const options = {
      limit: 10
    };
    if (event.options) {
      Object.assign(options, omitEmpty(event.options));
    }
    EmailTemplate.allBy('userId', decoded.sub, options).then(templates => {
      debug('= listTemplates.action', 'Success');
      return cb(null, templates);
    })
    .catch(e => {
      debug('= listTemplates.action', e);
      return cb(ApiErrors.response(e));
    });
  })
  .catch(err => cb(ApiErrors.response(err), null));
}
