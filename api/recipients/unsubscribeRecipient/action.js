'use strict';

import { Recipient } from 'moonmail-models';
import { debug } from '../../lib/logger';
import moment from 'moment';
import omitEmpty from 'omit-empty';
import { SNS } from 'aws-sdk';
import { ApiErrors } from '../../lib/errors';

const sns = new SNS({region: process.env.SERVERLESS_REGION});

export function respond(event, cb) {
  debug('= unsubscribeRecipient.action', JSON.stringify(event));
  if (event.listId && event.recipientId) {
    const recipient = {
      status: Recipient.statuses.unsubscribed,
      unsubscribedAt: moment().unix(),
      unsubscribedCampaignId: event.campaignId
    };
    Recipient.update(omitEmpty(recipient), event.listId, event.recipientId).then(newRecipient => {
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
          const callbackUrl = process.env.UNSUBSCRIBED_CALLBACK_URL;
          return cb(null, {url: callbackUrl});
        }
      });
    })
    .catch(e => {
      debug('= unsubscribeRecipient.action', e);
      return cb(e);
    });
  } else {
    return cb('No recipient specified');
  }
}
