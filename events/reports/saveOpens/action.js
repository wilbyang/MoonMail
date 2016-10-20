'use strict';

import { Open } from 'moonmail-models';
import { debug } from '../../lib/index';
import { SaveKinesisStreamService } from '../../lib/save_kinesis_stream_service';

export function respond(event, cb) {
  debug('= saveOpens.action', JSON.stringify(event));
  const service = SaveKinesisStreamService.create(event, Open);
  return service.save()
    .then(() => cb(null, true))
    .catch(err => cb(err));
}
