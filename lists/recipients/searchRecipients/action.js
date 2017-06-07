import { logger } from '../../lib/index';
import Segments from '../../lib/segments/index';

export default function respond(event, cb) {
  logger().info('= listSegments.action', JSON.stringify(event));
  return Segments.listSegmentMembersFromConditions(event.conditions, event.from || 0, event.size || 10)
    .then(members => cb(null, members))
    .catch((err) => {
      logger().error(err, err.stack);
      return cb(err);
    });
}
