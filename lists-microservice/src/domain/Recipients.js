import Promise from 'bluebird';
import RecipientModel from './RecipientModel';
import RecipientESModel from './RecipientESModel';

function importFromEvents(recipientImportedEvents) {
  const recipients = recipientImportedEvents
    .map(event => Object.assign({}, event.payload.recipient, { status: RecipientModel.statuses.subscribed, subscriptionOrigin: RecipientModel.subscriptionOrigins.listImport, isConfirmed: true }));

  return RecipientModel.batchCreate(recipients)
    .then((data) => {
      if (data.UnprocessedItems) {
        if (Object.keys(data.UnprocessedItems).length > 0) return Promise.reject(new Error('Unprocessed items'));
      }
      return data;
    });
}

function createBatchFromEvents(recipientCreatedEvents) {
  const recipients = recipientCreatedEvents
    .map(event => event.payload.recipient);
  return RecipientModel.batchCreate(recipients)
    .then((data) => {
      if (data.UnprocessedItems) {
        if (Object.keys(data.UnprocessedItems).length > 0) return Promise.reject(new Error('Unprocessed items'));
      }
      return data;
    });
}

function updateBatchFromEvents(recipientUpdatedEvents) {
  return Promise.map(recipientUpdatedEvents, (recipientUpdatedEvent) => {
    return RecipientModel.update(recipientUpdatedEvent.payload.data, recipientUpdatedEvent.payload.listId, recipientUpdatedEvent.payload.id);
  }, { concurrency: 2 });
}

function fixMetadataAttrs(m) {
  if (!m) return {};
  return Object.keys(m)
    .filter(r => r.match(/^[A-Za-z_]+[A-Za-z0-9_]*$/))
    .reduce((acum, key) => {
      acum[key.toString()] = m[key].toString();
      return acum;
    }, {});
}

function cleanseRecipientAttributes(recipient) {
  const newRecipient = {
    listId: recipient.listId,
    userId: recipient.userId,
    id: (recipient.id || '').toString(),
    email: recipient.email,
    subscriptionOrigin: recipient.subscriptionOrigin || 'listImport',
    isConfirmed: recipient.isConfirmed,
    status: recipient.status,
    riskScore: recipient.riskScore,
    metadata: fixMetadataAttrs(recipient.metadata),
    systemMetadata: recipient.systemMetadata,
    unsubscribedAt: recipient.unsubscribedAt,
    subscribedAt: recipient.subscribedAt,
    unsubscribedCampaignId: recipient.unsubscribedCampaignId,
    bouncedAt: recipient.bouncedAt,
    complainedAt: recipient.complainedAt,
    createdAt: recipient.createdAt,
    updatedAt: recipient.updatedAt
  };

  if (!newRecipient.email || !newRecipient.listId || !newRecipient.userId || !newRecipient.id) {
    return {};
  }
  return newRecipient;
}

export default {
  buildId: RecipientModel.buildId,
  create: RecipientModel.create,
  batchCreate: RecipientModel.batchCreate,
  update: RecipientModel.update,
  delete: RecipientModel.delete,
  createBatchFromEvents,
  updateBatchFromEvents,
  importFromEvents,
  find: RecipientESModel.find,
  createEs: RecipientESModel.create,
  updateEs: RecipientESModel.update,
  deleteEs: RecipientESModel.remove,
  searchByListAndConditions: RecipientESModel.searchByListAndConditions,
  cleanseRecipientAttributes
};
