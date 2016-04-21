'use strict';

import { Kinesis } from 'aws-sdk';
import { DEBUG } from '../../lib/logger';

const buffer = new Kinesis({region: process.env.SERVERLESS_REGION});

export default (event, context) => {
  // must return a promise, a JSON.stringify compatible data, null or nothing.
  DEBUG('= emailOpen.handler', JSON.stringify(event));
  const payload = {
    campaignId: event.campaignId
  };
  const params = {
    Data: JSON.stringify(payload),
    PartitionKey: event.campaignId,
    StreamName: process.env.OPENS_STREAM_NAME
  };
  buffer.putRecord(params, (err, data) => {
    if (err) {
      DEBUG('= emailOpen.handler', 'Error pushing to buffer', err);
    } else {
      DEBUG('= emailOpen.handler', 'Message successfully pushed to buffer');
    }
     return context.done(err, data);
  });
}

