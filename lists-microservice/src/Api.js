import omitEmpty from 'omit-empty';
import Events from './domain/Events';
import Recipients from './domain/Recipients';
import Lists from './domain/Lists';
import EventLog from './EventLog';
import RecipientModel from './domain/RecipientModel';
import RecipientESModel from './domain/RecipientESModel';

function publishRecipientCreatedEvent({ listId, userId, createRecipientPayload, subscriptionOrigin }) {
  return Events.buildRecipientCreatedEvent({ listId, userId, recipient: createRecipientPayload, subscriptionOrigin })
    .then(recipientCreatedEvent => EventLog.write({ topic: Events.listRecipientCreated, streamName: process.env.LIST_RECIPIENT_STREAM_NAME, payload: recipientCreatedEvent }));
}

function publishRecipientUpdatedEvent({ listId, userId, recipientId, updateRecipientPayload }) {
  return Events.buildRecipientUpdatedEvent({ listId, userId, id: recipientId, data: updateRecipientPayload })
    .then(recipientUpdatedEvent => EventLog.write({ topic: Events.listRecipientUpdated, streamName: process.env.LIST_RECIPIENT_STREAM_NAME, payload: recipientUpdatedEvent }));
}

function publishRecipientDeletedEvent({ listId, userId, recipientId }) {
  return Events.buildRecipientDeleteEvent({ listId, userId, id: recipientId })
    .then(recipientDeletedEvent => EventLog.write({ topic: Events.listRecipientDeleted, streamName: process.env.LIST_RECIPIENT_STREAM_NAME, payload: recipientDeletedEvent }));
}

function listRecipients({ listId, conditions, options }) {
  return Recipients.searchByListAndConditions(listId, conditions, omitEmpty(options));
}

function getRecipient({ listId, recipientId }) {
  return Recipients.find({ listId, recipientId });
}

function createRecipientsBatch(recipientCreatedEvents) {
  return Recipients.createBatchFromEvents(recipientCreatedEvents);
}

function updateRecipientsBatch(recipientUpdatedEvents) {
  return Recipients.updateBatchFromEvents(recipientUpdatedEvents);
}

function importRecipientsBatch(recipientImportedEvents, importStatusListner = null) {
  return Recipients.importFromEvents(recipientImportedEvents)
    .then(() => Lists.updateMetadataAttrsAndImportStatusFromEvents(recipientImportedEvents, importStatusListner));
}

function deleteRecipientEs(recipient) {
  const globalId = RecipientModel.buildGlobalId({ recipient });
  return RecipientESModel.remove(globalId);
}

export default {
  publishRecipientCreatedEvent,
  publishRecipientUpdatedEvent,
  publishRecipientDeletedEvent,
  listRecipients,
  getRecipient,
  createRecipientsBatch,
  updateRecipientsBatch,
  importRecipientsBatch,
  getAllLists: Lists.all,
  createRecipientEs: Recipients.createEs,
  updateRecipientEs: Recipients.updateEs,
  deleteRecipientEs
};
