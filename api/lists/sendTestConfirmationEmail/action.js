'use strict';

import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import { SendTestEmailService } from '../../lib/services/send_test_email_service';
import { ApiErrors } from '../../lib/errors';
import { SES } from 'aws-sdk';

const sesClient = new SES({
  accessKeyId: process.env.DEFAULT_API_KEY,
  secretAccessKey: process.env.DEFAULT_API_SECRET,
  region: process.env.DEFAULT_DEFAULT_REGION
});

export function respond(event, cb) {
  debug('= sendTestConfirmationEmail.action', JSON.stringify(event));
  decrypt(event.authToken).then(decoded => {
    const testEmailService = SendTestEmailService.create(sesClient, event.list);
    testEmailService.sendEmail()
      .then(res => cb(null, res))
      .catch(err => cb(ApiErrors.response(err), null));
  })
  .catch(err => cb(ApiErrors.response(err), null));
}
