import * as AWS from 'aws-sdk';
import { getAll } from '../../lib/models/recipient';
import { debug } from '../../lib/logger';

AWS.config.region = process.env.SERVERLESS_REGION || 'us-east-1';

const sns = new AWS.SNS();

let sentRecipientsCount = 0;
let totalRecipientsToSendCount = 0;

export function respond(event, cb) {
  const msg = JSON.parse(event.Records[0].Sns.Message);
  if (msg.recipientsCount && msg.campaign && msg.campaign.listIds) {
    totalRecipientsToSendCount = msg.recipientsCount;
    const listIds = msg.campaign.listIds;
    sendCampaignRecipients(listIds, msg, cb).then(() => {
      if (!isRecipientsSendingInProgress()) {
        return cb(null, `Campaign ${msg.campaign.id} recipients have been successfully sent`);
      }
    }).catch(e => {
      debug(e);
      return cb(e);
    });
  } else {
    debug('AttachRecipientsService', 'Could not send campaign recipients');
    return cb('Required parameters are missing');
  }
}

function isRecipientsSendingInProgress() {
  return sentRecipientsCount < totalRecipientsToSendCount;
}

function sendCampaignRecipients(listIds, msg, cb) {
  let getLists = [];
  const recipientParams = {
    status: 'NORMAL'
  };
  listIds.forEach((id) => {
    getLists.push(sendNextBatch(id, msg, recipientParams, cb));
  });
  return Promise.all(getLists);
}

function sendNextBatch(id, msg, params, cb) {
  return getAll(id, params).then(data => {
    const messages = data.Items.map(r => {
      let message = msg;
      message.recipient = r;
      return publishToSns(message, cb);
    });
    Promise.all(messages).then().catch(e => {
      debug(e);
    });
    if (data.LastEvaluatedKey) {
      const params = {
        status: 'NORMAL',
        page: data.LastEvaluatedKey
      };
      return sendNextBatch(id, msg, params, cb);
    } else {
      return Promise.resolve();
    }
  });
}

function publishToSns(canonicalMessage, cb) {
  return new Promise((resolve, reject) => {
    debug('AttachRecipientsService.publishToSns', 'Sending canonical message', JSON.stringify(canonicalMessage));
    const params = {
      Message: JSON.stringify(canonicalMessage),
      TopicArn: process.env.PRECOMPILE_EMAIL_TOPIC_ARN
    };
    sns.publish(params, (err, data) => {
      if (err) {
        if (err.code === 'Throttling' || err.code === 'InternalFailure') {
          publishToSns(canonicalMessage);
          resolve();
        } else {
          debug('AttachRecipientsService.publishToSns', 'Error sending message', err);
          reject(err);
        }
      } else {
        sentRecipientsCount++;
        debug('AttachRecipientsService.publishToSns', 'Message sent');
        if (!isRecipientsSendingInProgress()) {
          return cb(null, `Campaign ${canonicalMessage.campaign.id} recipients have been successfully sent`);
        }
        resolve(data);
      }
    });
  });
}
