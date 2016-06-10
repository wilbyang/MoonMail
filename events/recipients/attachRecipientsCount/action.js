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
    debug('= attachRecipients.action', 'Count is', results);
    const recipientsCount = results.reduce((acumm, next) => (acumm + next));
    Object.assign(campaignMessage, {recipientsCount});
    const snsParams = {
      TopicArn: process.env.ATTACH_SENDER_TOPIC_ARN,
      Message: JSON.stringify(campaignMessage)
    }
    sns.publish(snsParams, (err, data) => {
      if (err) {
        debug('= attachRecipients.action', 'Error publishing message', err)
        cb(err);
      } else {
        cb(null, data);
      }
    });
  })
  .catch(err => cb(err));
}
