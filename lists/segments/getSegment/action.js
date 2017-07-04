import { logger } from '../../lib/index';
import Segments from '../../lib/segments/index';


export default function respond(event, cb) {
  logger().info('= getSegment.action', JSON.stringify(event));
  return Segments.getSegment(event.listId, event.segmentId)
    .then(segment => cb(null, segment))
    .catch((err) => {
      logger().error(err);
      return cb(err);
    });
}
