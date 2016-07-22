import * as AWS from 'aws-sdk';
import { AttachRecipientsCountService } from '../../lib/attach_recipients_count_service';
import { debug } from '../../lib/logger';
import { parse } from 'aws-event-parser';

AWS.config.region = process.env.SERVERLESS_REGION || 'us-east-1';

const sns = new AWS.SNS();

export function respond(event, cb) {
  debug('= attachRecipientsCount.action', JSON.stringify(event));
  const campaignMessage = parse(event)[0];
  const service = AttachRecipientsCountService.create(campaignMessage, sns);
  service.attachCount()
    .then(campaign => cb(null, campaign))
    .catch(err => cb(err));
}
