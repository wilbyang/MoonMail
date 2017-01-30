'use strict';
import { debug } from '../../lib/logger';
import { strip } from 'eskimo-stripper';
import { CleanRecipientsEmailService } from '../../lib/clean_recipients_email_service';

export function respond(event, cb) {
  debug('= cleanRecipients.action called');
  const newRecipients = event.Records.filter(record => record.eventName === 'INSERT')
    .map(record => strip(record.dynamodb.NewImage));
  CleanRecipientsEmailService.cleanAndUpdate(newRecipients)
    .then((data) => cb(null, data))
    .catch((err) => cb(err));
}
