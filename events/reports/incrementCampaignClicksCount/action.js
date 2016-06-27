'use strict';

import { debug } from '../../lib/index';
import { IncrementCampaignsClicksService } from '../../lib/increment_campaigns_clicks_service';

export function respond(event, cb) {
  debug('= incrementCampaignsClicksCount.action', event);
  const incrementService = new IncrementCampaignsClicksService(event.Records);
  incrementService.incrementAll()
    .then(data => {
      cb(null, 'ok');
    })
    .catch(err => {
      cb(err);
    });
};
