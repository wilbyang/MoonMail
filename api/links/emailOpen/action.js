import AWS from 'aws-sdk';
import omitEmpty from 'omit-empty';
import moment from 'moment';
import fs from 'fs';
import base64url from 'base64-url';
import { logger } from '../../lib/index';

const buffer = new AWS.Kinesis({ region: process.env.SERVERLESS_REGION });
const file = 'links/emailOpen/resources/open.gif';

export default function respond(event, context, cb) {
  logger().info('= emailOpen.action', JSON.stringify(event));

  const payload = omitEmpty({
    campaignId: event.campaignId,
    recipientId: event.recipientId,
    userId: event.userId ? base64url.decode(event.userId) : null,
    listId: event.listId,
    segmentId: event.segmentId,
    metadata: JSON.parse(event.headers),
    timestamp: moment().unix()
  });
  const params = {
    Data: JSON.stringify(payload),
    PartitionKey: event.campaignId,
    StreamName: process.env.OPENS_STREAM_NAME
  };
  return buffer.putRecord(params).promise()
    .then(() => cb(null, new Buffer(fs.readFileSync(file)).toString('base64')))
    .catch((err) => {
      logger().error(err);
      return cb(null, new Buffer(fs.readFileSync(file)).toString('base64'));
    });
}
