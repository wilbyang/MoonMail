import { logger } from '../../lib/index';
import Segments from '../../lib/segments/index';

export default function respond(event, cb) {
  logger().info('= listSegments.action', JSON.stringify(event));
  return Segments.listSegments(event.listId, event.options)
    .then(segment => cb(null, segment))
    .catch((err) => {
      logger().error(err);
      return cb(err);
    });
}

