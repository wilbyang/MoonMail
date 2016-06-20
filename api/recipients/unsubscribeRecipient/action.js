'use strict';

import { Recipient } from 'moonmail-models';
import { debug } from '../../lib/logger';
import moment from 'moment';

export function respond(event, cb) {
  debug('= unsubscribeRecipient.action', JSON.stringify(event));
  if (event.listId && event.recipientId) {
    const recipient = {
      status: Recipient.statuses.unsubscribed,
      unsubscribedAt: moment().unix()
    };
    Recipient.update(recipient, event.listId, event.recipientId).then(recipient => {
      debug('= unsubscribeRecipient.action', 'Success');
      return cb(null, recipient);
    })
    .catch(e => {
      debug('= unsubscribeRecipient.action', e);
      return cb(e);
    });
  } else {
    return cb('No recipient specified');
  }
}
