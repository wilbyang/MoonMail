'use strict';

import { IncrementCampaignsUnsubscriptionsService } from '../../lib/increment_campaigns_unsubscriptions_service';
import { debug } from '../../lib/index';
import { parse } from 'aws-event-parser';

export function respond(event, cb) {
  debug('= unsubscribedCampaign.action', JSON.stringify(event));
  const snsRecords = parse(event);
  const unsubscribedService = new IncrementCampaignsUnsubscriptionsService(snsRecords);
  unsubscribedService.incrementAll()
    .then((data) => cb(null, data))
    .catch((err) => cb(err));
}
