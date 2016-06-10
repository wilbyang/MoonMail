import * as AWS from 'aws-sdk';
import { Recipient } from 'moonmail-models';
import { debug } from '../../lib/logger';
import { parse } from 'aws-event-parser';

AWS.config.region = process.env.SERVERLESS_REGION || 'us-east-1';

const sns = new AWS.SNS();

export function respond(event, cb) {
  debug('= attachRecipients.action', JSON.stringify(event));
  const campaignMessage = parse(event)[0];
  const countPromises = campaignMessage.campaign.listIds.map(listId => Recipient.countBy('listId', listId));
  Promise.all(countPromises).then(results => {
    const recipientsCount = results.reduce((acumm, next) => (acumm + next));
    Object.assign(campaignMessage, {recipientsCount});
    cb(null, campaignMessage);
  })
  .catch(err => cb(err));
}
