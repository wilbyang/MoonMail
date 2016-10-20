'use strict';

import { Kinesis } from 'aws-sdk';
import { debug } from '../../lib/logger';
import moment from 'moment';

const buffer = new Kinesis({region: process.env.SERVERLESS_REGION});

export default (event, context) => {
  // must return a promise, a JSON.stringify compatible data, null or nothing.
  debug('= emailOpen.handler', JSON.stringify(event));
  const payload = {
    campaignId: event.campaignId,
    recipientId: event.recipientId,
    timestamp: moment().unix()
  };
  const params = {
    Data: JSON.stringify(payload),
    PartitionKey: event.campaignId,
    StreamName: process.env.OPENS_STREAM_NAME
  };
  buffer.putRecord(params, (err, data) => {
    if (err) {
      debug('= emailOpen.handler', 'Error pushing to buffer', err);
    } else {
      debug('= emailOpen.handler', 'Message successfully pushed to buffer');
    }
    return context.done(err, data);
  });
};

