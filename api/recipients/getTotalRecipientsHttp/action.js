import omitEmpty from 'omit-empty';
import { logger } from '../../lib/index';
import FunctionsClient from '../../lib/functions_client';
import decrypt from '../../lib/auth-token-decryptor';
import { paramsChecker, errorHandler } from '../../lib/api-utils';

export default function respond(event, cb) {
  logger().info('= getTotalRecipientsHttp.action', JSON.stringify(event));
  const checkParams = paramsChecker(['authToken']);
  return checkParams(omitEmpty(event))
    .then(params => decrypt(params.authToken))
    .then(decoded => getTotalRecipients(decoded.sub))
    .then(total => cb(null, total))
    .catch((err) => {
      logger().error(err);
      return errorHandler(err, [], cb);
    });
}

function getTotalRecipients(userId) {
  return FunctionsClient.execute(process.env.GET_TOTAL_RECIPIENTS_FUNCTION, { userId });
}
