import omitEmpty from 'omit-empty';
import { logger } from '../../lib/index';
import Segments from '../../lib/segments/index';

export default function respond(event, cb) {
  logger().info('= listSegmentMembers.action', JSON.stringify(event));
  const options = event.options || {};
  return Segments.listMembers(event.segmentId, omitEmpty(options))
    .then(members => cb(null, members))
    .catch((err) => {
      logger().error(err);
      return cb(err);
    });
}
