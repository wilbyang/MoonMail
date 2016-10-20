'use strict';

import { debug } from '../../lib/index';
import { OpensAggregatorService } from '../../lib/opens_aggregator_service';

export default (event, context) => {
  debug('= incrementOpensCount.handler', JSON.stringify(event));
  const incrementService = OpensAggregatorService.create(event);
  incrementService.increment()
    .then(() => context.done(null, 'ok'))
    .catch(err => {
      debug('= incrementOpensCount.handler', 'Some error occured', err);
      context.done(err);
    });
};
