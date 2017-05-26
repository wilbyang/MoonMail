import { Automation } from 'moonmail-models';
import omitEmpty from 'omit-empty';
import { logger } from '../../lib/index';
import decrypt from '../../lib/auth-token-decryptor';
import { paramsChecker, errorHandler } from '../../lib/api-utils';

export default function respond(event, cb) {
  logger().info('= updateAutomation.action', JSON.stringify(event));
  const checkParams = paramsChecker(['authToken', 'automationId', 'automation']);
  return checkParams(omitEmpty(event))
    .then(params => decrypt(params.authToken))
    .then(decoded => updateAutomation(decoded.sub, event))
    .then(automation => cb(null, automation))
    .catch((err) => {
      logger().error(err);
      return errorHandler(err, [], cb);
    });
}

function updateAutomation(userId, event) {
  return Automation.update(event.automation, userId, event.automationId);
}
