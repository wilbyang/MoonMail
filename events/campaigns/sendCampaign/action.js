'use strict';

import * as aws from 'aws-sdk';
import { SendCampaignService } from '../../lib/send_campaign_service';
import { debug } from '../../lib/index';

aws.config.update({region: process.env.SERVERLESS_REGION});
const sns = new aws.SNS();

export function respond(event, cb) {
  debug('= sendCampaign.action', JSON.stringify(event));
  const sendService = new SendCampaignService(sns, event.campaignId, event.userId);
  sendService.sendCampaign()
    .then((data) => cb(null, data))
    .catch((err) => cb(err));
}
