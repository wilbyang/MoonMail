import { AutomationAction } from 'moonmail-models';
import omitEmpty from 'omit-empty';
import { logger } from '../../../lib/index';
import decrypt from '../../../lib/auth-token-decryptor';
import { paramsChecker, errorHandler } from '../../../lib/api-utils';

export default function respond(event, cb) {
  logger().info('= listAutomationActions.action', JSON.stringify(event));
  const checkParams = paramsChecker(['authToken', 'automationId']);
  return checkParams(omitEmpty(event))
    .then(params => decrypt(params.authToken))
    .then(() => listAutomationActions(event))
    .then(automations => cb(null, automations))
    .catch((err) => {
      logger().error(err);
      return errorHandler(err, [], cb);
    });
}

function listAutomationActions(event) {
  const defaultOptions = {limit: 10};
  const options = Object.assign(defaultOptions, omitEmpty(event.options || {}));
  return AutomationAction.allBy('automationId', event.automationId, options);
}
