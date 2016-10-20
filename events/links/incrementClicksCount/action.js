'use strict';

import { debug } from '../../lib/index';
import { LinkClicksAggregatorService } from '../../lib/link_clicks_aggregator_service';

export function respond(event, cb) {
  debug('= incrementClicksCount.action', JSON.stringify(event));
  const incrementService = LinkClicksAggregatorService.create(event);
  incrementService.increment()
    .then(data => {
      cb(null, 'ok');
    })
    .catch(err => {
      cb(err);
    });
};
