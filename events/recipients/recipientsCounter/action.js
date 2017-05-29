// import * as aws from 'aws-sdk';
import { debug } from '../../lib/index';
import { RecipientsCounterService } from '../../lib/recipients_counter_service';

// aws.config.update({region: process.env.SERVERLESS_REGION});

export function respond(event, cb) {
  debug('= recipientsCounter.action', JSON.stringify(event));
  const recipientsCounterService = RecipientsCounterService.create(event);
  recipientsCounterService.updateCounters()
    .then(data => cb(null, data))
    .catch(err => cb(err));
}
