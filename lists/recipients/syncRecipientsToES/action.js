import { logger } from '../../lib/index';
import Recipients from '../../lib/recipients/index';

export default function respond(event, cb) {
  logger().info('= syncRecipientsToES', JSON.stringify(event));
  Recipients.syncRecipientStreamWithES(event.Records)
    .then(response => cb(null, response))
    .catch((error) => {
      logger().error('= syncRecipientsToES', error, error.stack);
      cb(error);
    });
}
