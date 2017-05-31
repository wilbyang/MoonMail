import Promise from 'bluebird';
import { Automation, AutomationAction } from 'moonmail-models';
import omitEmpty from 'omit-empty';
import { logger } from '../../lib/index';
import decrypt from '../../lib/auth-token-decryptor';
import { paramsChecker, errorHandler } from '../../lib/api-utils';

export default function respond(event, cb) {
  logger().info('= pauseAutomation.action', JSON.stringify(event));
  const checkParams = paramsChecker(['authToken', 'automationId']);
  return checkParams(omitEmpty(event))
    .then(params => decrypt(params.authToken))
    .then(decoded => pauseAutomation(decoded.sub, event))
    .then(() => cb(null, {status: 'paused'}))
    .catch((err) => {
      logger().error(err);
      return errorHandler(err, [], cb);
    });
}

function pauseAutomation(userId, event) {
  return Automation.update({status: 'paused'}, userId, event.automationId)
    .then(() => pauseAutomationActions(event.automationId));
}

function pauseAutomationActions(automationId) {
  return AutomationAction.allBy('automationId', automationId)
    .then(actions => Promise.map(actions.items,
      action => pauseAutomationAction(action),
      {concurrency: 1}
    ));
}

function pauseAutomationAction(action) {
  return AutomationAction.update({status: 'paused'}, action.automationId, action.id);
}
