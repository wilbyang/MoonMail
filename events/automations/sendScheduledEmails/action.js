import { logger } from '../../lib/index';
import SendScheduledEmails from '../lib/send_scheduled_emails';

export default function respond(event, cb) {
  logger().info('Event:', JSON.stringify(event));
  return SendScheduledEmails.execute()
    .then(() => cb())
    .catch(() => cb());
}
