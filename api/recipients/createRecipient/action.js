import { Recipient, List } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import base64url from 'base64-url';

/*
 * Check event.recipient and recipient status
 * Decodes token
 * Creates a new recipient object
 * Saves the new recipient and updates list's metadaAttributes
 */
export const createRecipient = async event => {
  debug('= createRecipient.action', JSON.stringify(event));
  await checkRecipient(event);
  
  const decoded = await decrypt(event.authToken);
  const { newRecipient, metadataAttributes } = createNewRecipient(decoded.sub, event);
  await Recipient.save(newRecipient);

  await List.appendMetadataAttributes(metadataAttributes,
    { userId: newRecipient.userId, listId: newRecipient.listId });

  return newRecipient;
}

const checkRecipient = async (event) => {
  if (!event.listId || !event.recipient || !event.recipient.email) throw new Error('No recipient specified')
  const recipientId = base64url.encode(event.recipient.email);
  const existingRecipient = await Recipient.get(event.listId, recipientId)
  if (existingRecipient.status == Recipient.statuses.unsubscribed) throw new Error('Recipient already exists')
  return '';
}

const createNewRecipient = (userId, event) => {
  const newRecipient = event.recipient;
  newRecipient.listId = event.listId;
  newRecipient.id = base64url.encode(event.recipient.email);
  newRecipient.status = event.recipient.status || Recipient.statuses.subscribed;
  newRecipient.userId = userId;
  newRecipient.subscriptionOrigin = Recipient.subscriptionOrigins.manual;
  const metadataAttributes = Object.keys(event.recipient.metadata || {});
  return { newRecipient, metadataAttributes }
}