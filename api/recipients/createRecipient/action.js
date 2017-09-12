import { Recipient, List } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import base64url from 'base64-url';
import { ApiErrors } from '../../lib/errors';

export function respond(event, cb) {
  debug('= createRecipient.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.listId && event.recipient && event.recipient.email) {
      const recipient = event.recipient;
      recipient.listId = event.listId;
      recipient.id = base64url.encode(recipient.email);
      recipient.status = recipient.status || Recipient.statuses.subscribed;
      recipient.userId = decoded.sub;
      recipient.subscriptionOrigin = Recipient.subscriptionOrigins.manual;
      const metadataAttributes = Object.keys(recipient.metadata || {});
      Recipient.save(recipient)
        .then(() => List.appendMetadataAttributes(metadataAttributes,
                      {userId: recipient.userId, listId: recipient.listId}))
        .then(() => cb(null, recipient))
        .catch((e) => {
          debug(e);
          return cb(ApiErrors.response(e));
        });
    } else {
      return cb(ApiErrors.response('No recipient specified'));
    }
  })
    .catch(err => cb(ApiErrors.response(err), null));
}
