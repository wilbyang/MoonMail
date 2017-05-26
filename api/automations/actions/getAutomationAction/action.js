import { AutomationAction } from 'moonmail-models';
import omitEmpty from 'omit-empty';
import { logger } from '../../../lib/index';
import decrypt from '../../../lib/auth-token-decryptor';
import { paramsChecker, errorHandler } from '../../../lib/api-utils';

export default function respond(event, cb) {
  logger().info('= getAutomationAction.action', JSON.stringify(event));
  const checkParams = paramsChecker(['authToken', 'automationId', 'actionId']);
  return checkParams(omitEmpty(event))
    .then(params => decrypt(params.authToken))
    .then(() => getAutomationAction(event))
    .then(automation => cb(null, automation))
    .catch((err) => {
      logger().error(err);
      return errorHandler(err, [], cb);
    });
}

function getAutomationAction(event) {
  const defaultOptions = {};
  const options = Object.assign(defaultOptions, omitEmpty(event.options || {}));
  return AutomationAction.get(event.automationId, event.actionId, options);
}
