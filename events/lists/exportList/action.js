'use strict';

import { debug } from '../../lib/index';
import ExportListService from '../../lib/export_list_service';

export function respond(event, cb) {
  debug('= exportList.action', JSON.stringify(event));
  ExportListService.export(event.listId, event.userId, event.fields)
    .then((data) => cb(null, data))
    .catch((err) => cb(err));
}
