import { logger } from '../../lib/index';
import Segments from '../../lib/segments/index';

export default function respond(event, cb) {
  logger().info('= createSegment.action', JSON.stringify(event));
  return Segments.createSegment(event.segment)
    .then(segment => cb(null, segment))
    .catch((err) => {
      logger().error(err);
      return cb(err);
    });
}

