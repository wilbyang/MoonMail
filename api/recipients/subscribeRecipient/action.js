import { Recipient } from 'moonmail-models';
import { debug } from '../../lib/logger';
import base64url from 'base64-url';

export function respond(event, cb) {
  debug('= subscribeRecipient.action', JSON.stringify(event));
  if (event.listId && event.recipient && event.recipient.email) {
    const recipient = event.recipient;
    recipient.listId = event.listId;
    recipient.id = base64url.encode(recipient.email);
    recipient.status = recipient.status || Recipient.statuses.awaitingConfirmation;
    recipient.subscriptionOrigin = Recipient.subscriptionOrigins.signupForm;
    Recipient.save(recipient).then(() => cb(null, recipient))
      .catch((e) => {
        debug(e);
        return cb(e);
      });
  } else {
    return cb('No recipient specified');
  }
}
