import { AutomationAction } from 'moonmail-models';
import omitEmpty from 'omit-empty';
import { logger } from '../../../lib/index';
import decrypt from '../../../lib/auth-token-decryptor';
import { paramsChecker, errorHandler } from '../../../lib/api-utils';

export default function respond(event, cb) {
  logger().info('= updateAutomationAction.action', JSON.stringify(event));
  const checkParams = paramsChecker(['authToken', 'automationId', 'actionId', 'action']);
  return checkParams(omitEmpty(event))
    .then(params => decrypt(params.authToken))
    .then(decoded => updateAutomationAction(decoded.sub, event))
    .then(automation => cb(null, automation))
    .catch((err) => {
      logger().error(err);
      return errorHandler(err, [], cb);
    });
}

function updateAutomationAction(userId, event) {
  const {campaign, delay, name} = event.action;
  return AutomationAction.update(
    omitEmpty({campaign, delay, name}),
    event.automationId,
    event.actionId
  );
}
