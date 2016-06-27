'use strict';

import { debug } from '../../lib/index';
import { IncrementOpensService } from '../../lib/increment_opens_service';

export default (event, context) => {
  debug('= incrementOpensCount.handler');
  const incrementService = new IncrementOpensService(event.Records);
  incrementService.incrementAll()
    .then(() => context.done(null, 'ok'))
    .catch(err => context.done(err));
};
