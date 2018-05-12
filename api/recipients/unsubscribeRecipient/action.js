import * as url from 'url';
import moment from 'moment';
import omitEmpty from 'omit-empty';
import base64url from 'base64-url';
import { SNS, Kinesis } from 'aws-sdk';
import { Recipient, List } from 'moonmail-models';
import { debug } from '../../lib/logger';
import { ApiErrors } from '../../lib/errors';

const sns = new SNS({ region: process.env.SERVERLESS_REGION });
const kinesis = new Kinesis({ region: process.env.SERVERLESS_REGION });

export function respond(event, cb) {
  debug('= unsubscribeRecipient.respond', JSON.stringify(event));
  checkEvent(event)
    .then(updateRecipient)
    .then(createSNSParams)
    .then(publishToSNS)
    .then(buildURL)
    .then(publishToKinesis)
    .then(({ callbackUrl }) => cb(null, { url: callbackUrl }))
    .catch(e => handleErrors(e, cb))
}

const checkEvent = async (event) => {
  debug('= unsubscribeRecipient.checkEvent', JSON.stringify(event));
  if (event.listId && event.recipientId) {
    return {
      event, recipient: {
        status: Recipient.statuses.unsubscribed,
        unsubscribedAt: moment().unix(),
        unsubscribedCampaignId: event.campaignId
      }
    };
  } else {
    throw 'NO-RECIPIENT';
  }
}

const updateRecipient = async ({ event, recipient }) => {
  debug('= unsubscribeRecipient.updateRecipient', JSON.stringify(recipient));
  const newRecipient = await Recipient.update(omitEmpty(recipient), event.listId, event.recipientId)
  return { event, newRecipient }
}

const createSNSParams = async ({ event, newRecipient }) => {
  debug('= unsubscribeRecipient.createSNSParams', JSON.stringify(newRecipient));
  const recipientParams = {
    campaignId: event.campaignId,
    userId: newRecipient.userId,
    listId: event.listId
  };
  return {
    event, newRecipient, params: {
      Message: JSON.stringify(recipientParams),
      TopicArn: process.env.UNSUBSCRIBED_RECIPIENT_TOPIC_ARN
    }
  };
}

const publishToSNS = ({ event, newRecipient, params }) => {
  return new Promise((resolve, reject) => {
    debug('= unsubscribeRecipient.publishToSNS', JSON.stringify(newRecipient), JSON.stringify(params));
    sns.publish(params, (err, data) => {
      if (err) {
        debug('= unsubscribeRecipient.publishToSNS', 'Error publishing to SNS', JSON.stringify(err));
        reject('SNS-ERROR')
      } else {
        debug('= unsubscribeRecipient.publishToSNS', 'Successfully published to SNS');
        resolve({ event, newRecipient })
      }
    });
  })
}

const buildURL = ({ event, newRecipient }) => {
  return new Promise((resolve, reject) => {
    debug('= unsubscribeRecipient.buildURL', JSON.stringify(newRecipient));
    List.get(newRecipient.userId, event.listId).then((list) => {
      const callbackUrl = buildRedirectCallback(process.env.UNSUBSCRIBED_CALLBACK_URL, list, event.recipientId, event.campaignId);
      resolve({ event, newRecipient, callbackUrl })
    }).catch((e) => {
      const callbackUrl = process.env.UNSUBSCRIBED_CALLBACK_URL;
      resolve({ event, newRecipient, callbackUrl });
    });
  });
}

const publishToKinesis = async ({ event, newRecipient, callbackUrl }) => {
  debug('= unsubscribeRecipient.publishToKinesis', JSON.stringify(event), JSON.stringify(callbackUrl), JSON.stringify(newRecipient));
  const kinesisEvent = { type: `list.${Recipient.statuses.unsubscribed}`, payload: { event: Recipient.statuses.unsubscribed, item: 'list', itemId: event.listId, recipient: { id: newRecipient.id, email: newRecipient.email, listId: newRecipient.listId } } }
  const kinesisParams = { Data: JSON.stringify(kinesisEvent), PartitionKey: kinesisEvent.type, StreamName: process.env.EVENTS_ROUTER_STREAM_NAME }
  await kinesis.putRecord(kinesisParams).promise()
  return { event, callbackUrl };
}

const handleErrors = async (e, cb) => {
  if (e == 'NO-RECIPIENT') {
    debug('= unsubscribeRecipient.action.NO-RECIPIENT', e);
    return cb('No recipient specified');
  }
  if (e == 'SNS-ERROR') {
    debug('= unsubscribeRecipient.action.SNS-ERROR', e);
    return cb(ApiErrors.response(err));
  }

  debug('= unsubscribeRecipient.action.error', e);
  return cb(e);
}

function buildRedirectCallback(baseUrl, list, recipientId, campaignId) {
  const listId = list.id;
  const listName = list.name;
  const baseUrlObject = url.parse(baseUrl);
  // const refToken = base64url.encode(JSON.stringify({ listId, recipientId, campaignId });
  const redirectCallback = Object.assign({}, baseUrlObject, { query: { listId, recipientId, campaignId, listName } });
  return url.format(redirectCallback);
}