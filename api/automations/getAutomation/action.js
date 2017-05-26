import { Automation } from 'moonmail-models';
import omitEmpty from 'omit-empty';
import { logger } from '../../lib/index';
import decrypt from '../../lib/auth-token-decryptor';
import { paramsChecker, errorHandler } from '../../lib/api-utils';

export default function respond(event, cb) {
  logger().info('= getAutomation.action', JSON.stringify(event));
  const checkParams = paramsChecker(['authToken', 'automationId']);
  return checkParams(omitEmpty(event))
    .then(params => decrypt(params.authToken))
    .then(decoded => getAutomation(decoded.sub, event))
    .then(automation => cb(null, automation))
    .catch((err) => {
      logger().error(err);
      return errorHandler(err, [], cb);
    });
}

function getAutomation(userId, event) {
  const defaultOptions = {};
  const options = Object.assign(defaultOptions, omitEmpty(event.options || {}));
  return Automation.get(userId, event.automationId, options);
}
