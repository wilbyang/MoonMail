'use strict';

import { debug } from '../../lib/index';
import { CampaignClicksAggregatorService } from '../../lib/campaign_clicks_aggregator_service';

export function respond(event, cb) {
  debug('= incrementCampaignsClicksCount.action', JSON.stringify(event));
  const incrementService = CampaignClicksAggregatorService.create(event);
  incrementService.increment()
    .then(data => {
      cb(null, 'ok');
    })
    .catch(err => {
      cb(err);
    });
}
