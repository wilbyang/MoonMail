'use strict';

import * as AWS from 'aws-sdk';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';

AWS.config.region = process.env.SERVERLESS_REGION || 'us-east-1';

export function respond(event, cb) {
  debug('= createCampaign.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.campaign && event.sender) {
      const params = {
        Message: JSON.stringify(event),
        TopicArn: process.env.PRECOMPILE_CAMPAIGN_TOPIC_ARN
      };
      sns.publish(event, (err, data) => {
        if (err) {
          debug('= sendTestCampaign.action', 'Error sending message', err);
          reject(err);
        } else {
          debug('= sendTestCampaign.action', 'Message sent');
          resolve(data);
        }
      });
    } else {
      return cb('No campaign specified');
    }
  })
  .catch(err => cb('403: No authentication token provided', null));
}
