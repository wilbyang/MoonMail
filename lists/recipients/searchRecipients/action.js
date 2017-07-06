import { logger } from '../../lib/index';
import Segments from '../../lib/segments/index';

export default function respond(event, cb) {
  logger().info('= searchRecipients.action', JSON.stringify(event));
  const listIdCondition = { condition: { queryType: 'match', fieldToQuery: 'listId', searchTerm: event.listId }, conditionType: 'filter' };
  event.conditions.push(listIdCondition);
  const options = event.options || {};
  return Segments.listSegmentMembersFromConditions(event.conditions, options.from || 0, options.size || 10)
    .then(members => cb(null, members))
    .catch((err) => {
      logger().error(err, err);
      return cb(err);
    });
}
