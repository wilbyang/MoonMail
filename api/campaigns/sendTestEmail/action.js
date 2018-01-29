import { SES } from 'aws-sdk';
import { logger } from '../../lib/index';
import decrypt from '../../lib/auth-token-decryptor';
import { SendTestEmailService } from '../../lib/services/send_test_email_service';
import { ApiErrors } from '../../lib/errors';
import FunctionsClient from '../../lib/functions_client';

const defaultSesCreds = {
  accessKeyId: process.env.DEFAULT_API_KEY,
  secretAccessKey: process.env.DEFAULT_API_SECRET,
  region: process.env.DEFAULT_DEFAULT_REGION
};

export function respond(event, cb) {
  logger().info('= sendTestEmail.action', JSON.stringify(event));
  decrypt(event.authToken)
    .then(decoded => getSender(decoded.sub, event.campaign.senderId))
    .then(sender => serviceFactory(event, sender))
    .then(service => service.sendEmail())
    .then(res => cb(null, res))
    .catch(err => {
      console.log(err);
      cb(ApiErrors.response(err), null)
    });
}

function getSender(userId, senderId) {
  const getSenderFunction = process.env.FETCH_SENDER_FN_NAME;
  return FunctionsClient.execute(getSenderFunction, {userId, senderId})
    .catch(() => ({}));
}

function serviceFactory(event, sender = {}) {
  const serviceParams = Object.assign({}, event.campaign, { sender });
  return buildSesClient(sender)
    .then(sesClient => SendTestEmailService.create(sesClient, serviceParams));
}

function buildSesClient(sender = {}) {
  const client = (sender.apiKey && sender.apiSecret && sender.region)
    ? new SES({accessKeyId: sender.apiKey, secretAccessKey: sender.apiSecret, region: sender.region})
    : new SES(defaultSesCreds);
  return Promise.resolve(client);
}
