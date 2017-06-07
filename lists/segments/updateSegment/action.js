import { logger } from '../../lib/index';
import Segments from '../../lib/segments/index';

export default function respond(event, cb) {
  logger().info('= updateSegment.action', JSON.stringify(event));
  return Segments.updateSegment(event.segment, event.listId, event.segmentId)
    .then(segment => cb(null, segment))
    .catch((err) => {
      logger().error(err, err.stack);
      return cb(err);
    });
}
