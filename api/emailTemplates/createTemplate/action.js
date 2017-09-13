import { EmailTemplate } from 'moonmail-models';
import cuid from 'cuid';
import request from 'request-promise';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import FunctionsClient from '../../lib/functions_client';
import { ApiErrors } from '../../lib/errors';

export function respond(event, cb) {
  debug('= createTemplate.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.template) {
      const template = event.template;
      template.userId = decoded.sub;
      template.id = cuid();
      handleScreenshot(template)
        .then(templateToSave => EmailTemplate.save(templateToSave))
        .then(() => cb(null, template))
        .catch((e) => {
          debug(e);
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
