import { parse } from 'aws-event-parser';
import { logger } from '../../lib/index';
import Events from '../../lib/events';
import EventsLog from '../../lib/events_log';

export default function respond(event, cb) {
  logger().info('= writeEvents.action', JSON.stringify(event));
  const payload = parse(event)[0];
  logger().debug('payload:', JSON.stringify(payload));
  if (!Events.isValid(payload)) return cb();
  logger().info('Event was valid');
  return EventsLog.write({payload}).then(() => cb());
}
