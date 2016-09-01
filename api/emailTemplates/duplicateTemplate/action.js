'use strict';

import { EmailTemplate } from 'moonmail-models';
import { debug } from '../../lib/logger';
import cuid from 'cuid';
import decrypt from '../../lib/auth-token-decryptor';
import { ApiErrors } from '../../lib/errors';

export function respond(event, cb) {
  debug('= duplicateTemplate.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.templateId) {
      EmailTemplate.get(decoded.sub, event.templateId).then((existingTemplate) => {
        let template = Object.assign({}, existingTemplate);
        template.id = cuid();
        template.userId = decoded.sub;
        template.name = `${existingTemplate.name} copy`;

        EmailTemplate.save(template).then(() => {
          return cb(null, template);
        }).catch(e => {
          debug(e);
          return cb(ApiErrors.response(e));
        });
      }).catch(e => {
        debug('= getTemplate.action', 'Error getting template', e);
        return cb(ApiErrors.response(e));
      });
    } else {
      return cb(ApiErrors.response('No template specified'));
    }
  }).catch(err => cb(ApiErrors.response(err), null));
}
