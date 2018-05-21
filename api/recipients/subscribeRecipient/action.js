import { Recipient } from 'moonmail-models';
import { debug } from '../../lib/logger';
import base64url from 'base64-url';
import { Kinesis } from 'aws-sdk';

const kinesis = new Kinesis({ region: process.env.SERVERLESS_REGION });

export function respond(event, cb) {
  debug('= subscribeRecipient.action', JSON.stringify(event));
  checkEvent(event)
    .then(createRecipient)
    .then(saveRecipient)
    .then(publishToKinesis)
    .then(({ savedRecipient }) => cb(null, savedRecipient))
    .catch(e => handleErrors(e, cb));
}

const checkEvent = async (event) => {
  debug('= subscribeRecipient.checkEvent', JSON.stringify(event));
  if (event.listId && event.recipient && event.recipient.email) {
    throw 'NO-RECIPIENT'
  }

  return event
}

const createRecipient = async (event) => {
  debug('= subscribeRecipient.createRecipient', JSON.stringify(event));
  const recipient = event.recipient;
  recipient.listId = event.listId;
  recipient.id = base64url.encode(recipient.email);
  recipient.status = recipient.status || Recipient.statuses.awaitingConfirmation;
  recipient.subscriptionOrigin = Recipient.subscriptionOrigins.signupForm;

  return { event, recipient }
}

const saveRecipient = async ({ event, recipient }) => {
  debug('= subscribeRecipient.saveRecipient', JSON.stringify(recipient));
  const savedRecipient = await Recipient.save(recipient)
  return { event, savedRecipient }
}

const publishToKinesis = async ({ event, savedRecipient }) => {
  debug('= subscribeRecipient.publishToKinesis', JSON.stringify(event), JSON.stringify(savedRecipient));
  const kinesisEvent = { type: `list.${Recipient.statuses.subscribed}`, payload: { event: Recipient.statuses.subscribed, item: 'list', itemId: event.listId } }
  const kinesisParams = { Data: JSON.stringify(kinesisEvent), PartitionKey: kinesisEvent.type, StreamName: process.env.EVENTS_ROUTER_STREAM_NAME }
  await kinesis.putRecord(kinesisParams).promise()
  return { event, savedRecipient };
}

const handleErrors = async (e, cb) => {
  if (e == 'NO-RECIPIENT') {
    debug('= subscribeRecipient.action.NO-RECIPIENT', e);
    return cb('No recipient specified');
  }

  debug('= subscribeRecipient.action.error', e);
  return cb(e);
}
