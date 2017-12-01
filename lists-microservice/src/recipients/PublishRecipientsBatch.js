import EventLog from '../EventLog';
import Events from '../domain/Events';

function publishRecipientsBatch(recipientsBatch, importId, startIndex, batchSize, total) {
  const eventsBatch = recipientsBatch.map((recipient, index) => ({
    type: Events.listRecipientImported,
    payload: {
      recipient,
      totalRecipients: total,
      recipientIndex: startIndex + index,
      importId
    }
  })).filter(Events.isValid);

  if (eventsBatch.length === 0) Promise.resolve();

  return EventLog.batchWrite({
    topic: Events.listRecipientImported,
    streamName: process.env.LIST_RECIPIENT_STREAM_NAME,
    data: eventsBatch
  });
}

export default {
  execute: publishRecipientsBatch
};
