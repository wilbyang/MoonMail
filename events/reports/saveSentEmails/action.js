'use strict';

import { parse } from 'aws-event-parser';
import { SentEmail } from 'moonmail-models';
import { debug } from '../../lib/index';

export function respond(event, cb) {
  debug('= saveSentEmails.action', JSON.stringify(event));
  const sentEmails = parse(event)[0];
  SentEmail.saveAll(sentEmails)
    .then((res) => cb(null, res))
    .catch((err) => cb(err, null));
}
