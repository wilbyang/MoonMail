import * as AWS from 'aws-sdk';
import { AttachListRecipientsService } from '../../lib/attach_list_recipients_service';
import { debug } from '../../lib/logger';
import { parse } from 'aws-event-parser';

AWS.config.region = process.env.SERVERLESS_REGION || 'us-east-1';

const sns = new AWS.SNS();
const lambda = new AWS.Lambda();

export function respond(event, cb, context) {
  debug('= attachListRecipients.action', JSON.stringify(event), typeof event);
  const recipientsBatchOffset = event.batchOffset;
  let attachRecipientsListMessage = event.Records[0].Sns.Message;
  if (!attachRecipientsListMessage.campaign) {
    attachRecipientsListMessage = JSON.parse(attachRecipientsListMessage);
  }
  const service = new AttachListRecipientsService(sns, attachRecipientsListMessage, lambda, context);
  service.attachRecipients(recipientsBatchOffset)
    .then(res => cb(null, res))
    .catch(err => cb(err));
}
