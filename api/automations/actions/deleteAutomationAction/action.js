import { AutomationAction } from 'moonmail-models';
import omitEmpty from 'omit-empty';
import { logger } from '../../../lib/index';
import decrypt from '../../../lib/auth-token-decryptor';
import { paramsChecker, errorHandler } from '../../../lib/api-utils';

export default function respond(event, cb) {
  logger().info('= updateAutomationAction.action', JSON.stringify(event));
  const checkParams = paramsChecker(['authToken', 'automationId', 'actionId']);
  return checkParams(omitEmpty(event))
    .then(params => decrypt(params.authToken))
    .then(decoded => deleteAutomationAction(decoded.sub, event))
    .then(() => cb(null, {}))
    .catch((err) => {
      logger().error(err);
      return errorHandler(err, [], cb);
    });
}

function deleteAutomationAction(userId, event) {
  return AutomationAction.delete(event.automationId, event.actionId);
}
