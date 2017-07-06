import { logger } from '../../lib/index';
import Segments from '../../lib/segments/index';

export default function respond(event, cb) {
  logger().info('= listSegmentMembers.action', JSON.stringify(event));
  const options = event.options || {};
  return Segments.getSegment(event.listId, event.segmentId)
    .then(segment => getMembers(segment, event, options))
    .then(members => cb(null, members))
    .catch((err) => {
      logger().error(err);
      return cb(err);
    });
}

function getMembers(segment, event, options) {
  const listIdCondition = { condition: { queryType: 'match', fieldToQuery: 'listId', searchTerm: event.listId }, conditionType: 'filter' };
  segment.conditions.push(listIdCondition);
  return Segments.listSegmentMembersFromConditions(segment.conditions, options.from || 0, options.size || 10);
}

