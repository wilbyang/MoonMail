import { Kinesis } from 'aws-sdk';
import { logger } from './index';

export default class EventsLog {
  static write({payload = {}}) {
    logger().info('= EventsLog.write', JSON.stringify(payload));
    const params = {
      Data: JSON.stringify(payload),
      PartitionKey: '1',
      StreamName: process.env.EVENTS_LOG_STREAM_NAME
    };
    logger().debug('= EventsLog.write, params:', JSON.stringify(params));
    return this.client.putRecord(params).promise();
  }

  static get client() {
    return new Kinesis({region: process.env.SERVERLESS_REGION});
  }
}
