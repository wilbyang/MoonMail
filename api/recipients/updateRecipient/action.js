'use strict';

import { Recipient } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import { ApiErrors } from '../../lib/errors';

export function respond(event, cb) {
  debug('= updateRecipient.action', JSON.stringify(event));
  decrypt(event.authToken)
    .then(decoded => checkEvent(event, decoded))
    .then(checkRecipient)
    .then(updateRecipient)
    .then(recipient => cb(null, recipient))
    .catch(e => handleErrors(e, cb))
}

const checkEvent = async (event, decoded) => {
  debug('= updateRecipient.checkEvent', JSON.stringify(event), JSON.stringify(decoded));
  if (!event.listId || !event.recipientId || !event.recipient) throw 'No recipient specified'
  else return { event, decoded }
}

const checkRecipient = async ({ event, decoded }) => {
  debug('= updateRecipient.checkRecipient', JSON.stringify(event), JSON.stringify(decoded));
  const recipient = await Recipient.get(event.listId, event.recipientId)
  if (!recipient || !recipient.id) throw 'Invalid recipient'
  else return event
}

const updateRecipient = async (event) => {
  debug('= updateRecipient.updateRecipient', JSON.stringify(event));
  delete event.recipient.email;
  const recipient = await Recipient.update(event.recipient, event.listId, event.recipientId)
  return recipient
}

const handleErrors = async (e, cb) => {
  debug('= updateRecipient.handleErrors', JSON.stringify(e));
  return cb(ApiErrors.response(e));
}