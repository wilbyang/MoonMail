import { Kinesis } from 'aws-sdk';
import moment from 'moment';
import { debug } from '../../lib/logger';

const buffer = new Kinesis({region: process.env.SERVERLESS_REGION});

export default (event, context) => {
  debug('= linkClick.handler', JSON.stringify(event));
  const payload = {
    campaignId: event.campaignId,
    linkId: event.linkId,
    recipientId: event.recipientId,
    timestamp: moment().unix()
  };
  const params = {
    Data: JSON.stringify(payload),
    PartitionKey: event.campaignId,
    StreamName: process.env.CLICKS_STREAM_NAME
  };
  buffer.putRecord(params, (err, data) => {
    if (err) {
      debug('= linkClick.handler', 'Error pushing to buffer', err);
    } else {
      debug('= linkClick.handler', 'Message successfully pushed to buffer');
    }
    return context.done(null, {url: addHttp(encodeURI(event.linkUrl))});
  });
};

function addHttp(url) {
  let uri = url;
  if (!/^(?:f|ht)tps?\:\/\//.test(uri)) {
    uri = `http://${uri}`;
  }
  return uri;
}
