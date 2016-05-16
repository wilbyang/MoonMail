'use strict';

import * as aws from 'aws-sdk';
import { debug } from '../../lib/index';
import { ParseLinksService } from '../../lib/parse_links_service';

aws.config.update({region: process.env.SERVERLESS_REGION});
const sns = new aws.SNS();

export function respond(event, cb) {
  debug('= links.parseLinks', JSON.stringify(event));
  const campaignParams = JSON.parse(event.Records[0].Sns.Message);
  if (campaignParams.hasOwnProperty('sender')
        && campaignParams.hasOwnProperty('campaign')
        && !campaignParams.campaign.precompiled) {
    debug('= links.parseLinks', 'The message is directed to this Lambda function');
    const precompileService = new ParseLinksService(sns, campaignParams);
    precompileService.precompile()
      .then((result) => {
        cb(null, result);
      })
      .catch(cb);
  } else {
    debug('= links.parseLinks', 'The message is NOT directed to this Lambda function');
    cb(null, 'Message not directed to this service, disregard...');
  }
}
