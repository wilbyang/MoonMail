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
        debug('= links.parseLinks', 'Success');
        const payload = {
          userId: campaignParams.userId,
          campaignId: campaignParams.campaign.id,
          status: 'sending'
        };
        const params = {
          TopicArn: process.env.UPDATE_CAMPAIGN_TOPIC_ARN,
          Message: JSON.stringify(payload)
        };
        sns.publish(params, (err, res) => {
          if (err) {
            debug('= links.parseLinks', 'Error publishing to SNS', err);
            cb(err);
          } else {
            debug('= links.parseLinks', 'Success sending SNS');
            cb(null, res);
          }
        });
      })
      .catch(cb);
  } else {
    debug('= links.parseLinks', 'The message is NOT directed to this Lambda function');
    cb(null, 'Message not directed to this service, disregard...');
  }
}
