import { Automation } from 'moonmail-models';
import omitEmpty from 'omit-empty';
import { logger } from '../../lib/index';
import decrypt from '../../lib/auth-token-decryptor';
import { paramsChecker, errorHandler } from '../../lib/api-utils';

export default function respond(event, cb) {
  logger().info('= listAutomations.action', JSON.stringify(event));
  const checkParams = paramsChecker(['authToken']);
  return checkParams(omitEmpty(event))
    .then(params => decrypt(params.authToken))
    .then(decoded => listAutomations(decoded.sub, event))
    .then(automations => cb(null, automations))
    .catch((err) => {
      logger().error(err);
      return errorHandler(err, [], cb);
    });
}

function listAutomations(userId, event) {
  const defaultOptions = {limit: 10};
  const options = Object.assign(defaultOptions, omitEmpty(event.options || {}));
  return Automation.allBy('userId', userId, options);
}
