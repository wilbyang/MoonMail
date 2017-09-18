import AWS from 'aws-sdk';
import moment from 'moment';
import omitEmpty from 'omit-empty';
import base64url from 'base64-url';
import { logger } from '../../lib/index';


const buffer = new AWS.Kinesis({ region: process.env.SERVERLESS_REGION });

export default function respond(event, context, cb) {
  logger().info('= linkClick.action', JSON.stringify(event));

  const payload = omitEmpty({
    campaignId: event.campaignId,
    linkId: event.linkId,
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
    StreamName: process.env.CLICKS_STREAM_NAME
  };
  return buffer.putRecord(params).promise()
    .then(() => cb(null, { url: addHttp(encodeURI(event.linkUrl)) }))
    .catch((err) => {
      logger().error(err);
      return cb(null, { url: addHttp(encodeURI(event.linkUrl)) });
    });
}

function addHttp(url) {
  let uri = url;
  if (!/^(?:f|ht)tps?\:\/\//.test(uri)) {
    uri = `http://${uri}`;
  }
  return uri;
}
