import omitEmpty from 'omit-empty';
import { logger } from '../../lib/index';
import FunctionsClient from '../../lib/functions_client';
import decrypt from '../../lib/auth-token-decryptor';
import { paramsChecker, errorHandler } from '../../lib/api-utils';

export default function respond(event, cb) {
  logger().info('= listSegmentMembersHttp.action', JSON.stringify(event));
  const checkParams = paramsChecker(['authToken']);
  return checkParams(omitEmpty(event))
    .then(params => decrypt(params.authToken))
    .then(decoded => listSegmentMembers(decoded.sub, event))
    .then(segment => cb(null, segment))
    .catch((err) => {
      logger().error(err);
      return errorHandler(err, [], cb);
    });
}

function listSegmentMembers(userId, event) {
  return FunctionsClient.execute(process.env.LIST_SEGMENT_MEMBERS_FUNCTION, event);
}
