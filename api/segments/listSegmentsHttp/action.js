import omitEmpty from 'omit-empty';
import { logger } from '../../lib/index';
import FunctionsClient from '../../lib/functions_client';
import decrypt from '../../lib/auth-token-decryptor';
import { paramsChecker, errorHandler } from '../../lib/api-utils';

export default function respond(event, cb) {
  logger().info('= listSegmentsHttp.action', JSON.stringify(event));
  const checkParams = paramsChecker(['authToken']);
  return checkParams(omitEmpty(event))
    .then(params => decrypt(params.authToken))
    .then(decoded => listSegments(decoded.sub, event))
    .then(segment => cb(null, segment))
    .catch((err) => {
      logger().error(err);
      return errorHandler(err, [], cb);
    });
}

function listSegments(userId, event) {
  return FunctionsClient.execute(process.env.LIST_SEGMENTS_FUNCTION, event);
}
