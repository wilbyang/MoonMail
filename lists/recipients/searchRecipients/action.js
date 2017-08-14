import omitEmpty from 'omit-empty';
import { logger } from '../../lib/index';
import Recipients from '../../lib/recipients/index';

export default function respond(event, cb) {
  logger().info('= searchRecipients.action', JSON.stringify(event));
  const options = event.options || {};
  return Recipients.searchRecipientsByListAndConditions(event.listId, event.conditions, omitEmpty(options))
    .then(members => cb(null, members))
    .catch((err) => {
      logger().error(err, err);
      return cb(JSON.stringify(err));
    });
}
