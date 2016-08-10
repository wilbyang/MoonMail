'use strict';

import decrypt from '../../lib/auth-token-decryptor';
import { BeeEditorProxyService } from '../../lib/services/bee_editor_proxy_service';
import { ApiErrors } from '../../lib/errors';
import { debug } from '../../lib/logger';

export function respond(event, cb) {
  debug('= getBeeTokenProxy.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    BeeEditorProxyService.execute()
      .then((response) => {
        return cb(null, JSON.parse(response));
      })
      .catch((error) => {
        debug(error);
        return cb(ApiErrors.response(error));
      });
  })
  .catch(err => cb(ApiErrors.response(err), null));
}
