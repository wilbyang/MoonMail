'use strict';

import { Kinesis } from 'aws-sdk';
import { DEBUG } from '../../lib/logger';

const buffer = new Kinesis({region: process.env.SERVERLESS_REGION});

export default (event, context) => {
  DEBUG('= linkClick.handler', JSON.stringify(event));
  const payload = {
    campaignId: event.campaignId,
    linkId: event.linkId
  };
  const params = {
    Data: JSON.stringify(payload),
    PartitionKey: event.campaignId,
    StreamName: process.env.CLICKS_STREAM_NAME
  };
  buffer.putRecord(params, (err, data) => {
    if (err) {
      DEBUG('= linkClick.handler', 'Error pushing to buffer', err);
    } else {
      DEBUG('= linkClick.handler', 'Message successfully pushed to buffer');
    }
     return context.done(err, data);
  });
}

