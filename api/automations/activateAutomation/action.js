import Promise from 'bluebird';
import { Automation, AutomationAction } from 'moonmail-models';
import omitEmpty from 'omit-empty';
import { logger } from '../../lib/index';
import decrypt from '../../lib/auth-token-decryptor';
import { paramsChecker, errorHandler } from '../../lib/api-utils';

export default function respond(event, cb) {
  logger().info('= activateAutomation.action', JSON.stringify(event));
  const checkParams = paramsChecker(['authToken', 'automationId']);
  return checkParams(omitEmpty(event))
    .then(params => decrypt(params.authToken))
    .then(decoded => activateAutomation(decoded.sub, event))
    .then(() => cb(null, {status: 'active'}))
    .catch((err) => {
      logger().error(err);
      return errorHandler(err, [], cb);
    });
}

function activateAutomation(userId, event) {
  return Automation.update({status: 'active'}, userId, event.automationId)
    .then(() => activateAutomationActions(event.automationId));
}

function activateAutomationActions(automationId) {
  return AutomationAction.allBy('automationId', automationId)
    .then(actions => Promise.map(actions.items,
      action => activateAutomationAction(action),
      {concurrency: 1}
    ));
}

function activateAutomationAction(action) {
  return AutomationAction.update({status: 'active'}, action.automationId, action.id);
}
