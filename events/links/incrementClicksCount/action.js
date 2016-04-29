'use strict';

import { debug } from '../../lib/index';
import { IncrementClicksService } from '../../lib/increment_clicks_service';

export function respond(event, cb) {
  debug('= incrementClicksCount.action', event);
  const incrementService = new IncrementClicksService(event.Records);
  incrementService.incrementAll()
    .then(data => {
      cb(null, 'ok');
    })
    .catch(err => {
      cb(err);
    });
};
