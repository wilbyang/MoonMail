import * as url from 'url';
import moment from 'moment';
import omitEmpty from 'omit-empty';
import base64url from 'base64-url';
import { SNS } from 'aws-sdk';
import { Recipient, List } from 'moonmail-models';
import { debug } from '../../lib/logger';
import { ApiErrors } from '../../lib/errors';

const sns = new SNS({ region: process.env.SERVERLESS_REGION });

export function respond(event, cb) {
  debug('= unsubscribeRecipient.action', JSON.stringify(event));
  if (event.listId && event.recipientId) {
    const recipient = {
      status: Recipient.statuses.unsubscribed,
      unsubscribedAt: moment().unix(),
      unsubscribedCampaignId: event.campaignId
    };
    Recipient.update(omitEmpty(recipient), event.listId, event.recipientId).then((newRecipient) => {
      debug('= unsubscribeRecipient.action', 'Success');
      const recipientParams = {
        campaignId: event.campaignId,
        userId: newRecipient.userId,
        listId: event.listId
      };
      const params = {
        Message: JSON.stringify(recipientParams),
        TopicArn: process.env.UNSUBSCRIBED_RECIPIENT_TOPIC_ARN
      };
      sns.publish(params, (err, data) => {
        if (err) {
          debug('= unsubscribeRecipient.action', 'Error publishing to SNS', JSON.stringify(err));
          return cb(ApiErrors.response(err));
        } else {
          debug('= unsubscribeRecipient.action', 'Successfully published to SNS');
          List.get(newRecipient.userId, event.listId).then((list) => {
            const callbackUrl = buildRedirectCallback(process.env.UNSUBSCRIBED_CALLBACK_URL, list, event.recipientId, event.campaignId);
            return cb(null, { url: callbackUrl });
          }).catch((e) => {
            const callbackUrl = process.env.UNSUBSCRIBED_CALLBACK_URL;
            return cb(null, { url: callbackUrl });
          });

        }
      });
    })
      .catch((e) => {
        debug('= unsubscribeRecipient.action', e);
        return cb(e);
      });
  } else {
    return cb('No recipient specified');
  }
}

function buildRedirectCallback(baseUrl, list, recipientId, campaignId) {
  const listId = list.id;
  const listName = list.name;
  const baseUrlObject = url.parse(baseUrl);
  // const refToken = base64url.encode(JSON.stringify({ listId, recipientId, campaignId });
  const redirectCallback = Object.assign({}, baseUrlObject, { query: { listId, recipientId, campaignId, listName } });
  return url.format(redirectCallback);
}
