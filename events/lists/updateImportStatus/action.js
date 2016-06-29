'use strict';

import * as aws from 'aws-sdk';
import { debug } from '../../lib/index';
import { UpdateImportStatusService } from '../../lib/update_import_status_service';
import { parse } from 'aws-event-parser';

aws.config.update({ region: process.env.SERVERLESS_REGION });

export function respond(event, cb) {
  debug('= updateImportSttus.action', JSON.stringify(event));
  const message = parse(event)[0];
  const updateImportStatusService = new UpdateImportStatusService(message);
  updateImportStatusService.updateListImportStatus()
    .then((data) => cb(null, data))
    .catch((err) => cb(err));
}
