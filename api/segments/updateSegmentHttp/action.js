import omitEmpty from 'omit-empty';
import { logger } from '../../lib/index';
import FunctionsClient from '../../lib/functions_client';
import decrypt from '../../lib/auth-token-decryptor';
import { paramsChecker, errorHandler } from '../../lib/api-utils';

export default function respond(event, cb) {
  logger().info('= updateSegmentHttp.action', JSON.stringify(event));
  const checkParams = paramsChecker(['authToken']);
  return checkParams(omitEmpty(event))
    .then(params => decrypt(params.authToken))
    .then(decoded => updateSegment(decoded.sub, event))
    .then(segment => cb(null, segment))
    .catch((err) => {
      logger().error(err);
      return errorHandler(err, [], cb);
    });
}

function updateSegment(userId, event) {
  const segment = Object.assign({}, { userId }, event.segment);
  return FunctionsClient.execute(process.env.UPDATE_SEGMENT_FUNCTION, { segment, listId: event.listId, segmentId: event.segmentId });
}
