import { EmailTemplate } from 'moonmail-models';
import request from 'request-promise';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import FunctionsClient from '../../lib/functions_client';

import { ApiErrors } from '../../lib/errors';

export function respond(event, cb) {
  debug('= updateTemplate.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.template && event.templateId) {
      handleScreenshot(event.template)
        .then(templateToUpdate => EmailTemplate.update(templateToUpdate, decoded.sub, event.templateId))
        .then((template) => {
          debug('= updateTemplate.action', 'Success');
          return cb(null, template);
        }).catch((e) => {
          debug('= updateTemplate.action', e);
          return cb(ApiErrors.response(e));
        });
    } else {
      return cb(ApiErrors.response('No template specified'));
    }
  }).catch(err => cb(ApiErrors.response(err), null));
}

function handleScreenshot(template) {
  if (template.thumbnail) return Promise.resolve(template);
  if (!template.html) return Promise.resolve(template);

  return FunctionsClient.execute(process.env.SCREENSHOTS_FUNCTION_NAME, { html: template.html })
    .then(thumbnailData => Object.assign({}, template, { thumbnail: thumbnailData.url }));
}
