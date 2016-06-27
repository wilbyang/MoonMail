'use strict';

import { debug } from '../../lib/index';
import { IncrementSentEmailsService } from '../../lib/increment_sent_emails_service';

export function respond(event, cb) {
  debug('= incrementSentEmailsCount.action', event);
  const incrementService = new IncrementSentEmailsService(event.Records);
  incrementService.incrementAll()
    .then(data => {
      cb(null, 'ok');
    })
    .catch(err => {
      cb(err);
    });
};
