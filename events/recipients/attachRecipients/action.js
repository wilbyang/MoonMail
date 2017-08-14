import * as AWS from 'aws-sdk';
import { AttachRecipientsService } from '../../lib/attach_recipients_service';
import { debug } from '../../lib/logger';
import { parse } from 'aws-event-parser';

AWS.config.region = process.env.SERVERLESS_REGION || 'us-east-1';

const sns = new AWS.SNS();

export function respond(event, cb) {
  debug('= attachRecipients.action', JSON.stringify(event));
  const campaignMessage = parse(event)[0];
  const service = new AttachRecipientsService(sns, campaignMessage);
  service.execute()
    .then(res => cb(null, res))
    .catch(err => cb(err));
}
