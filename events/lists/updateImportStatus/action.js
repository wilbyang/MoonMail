import aws from 'aws-sdk';
import { parse } from 'aws-event-parser';
import { debug } from '../../lib/index';
import UserNotifier from '../../lib/user_notifier';
import { UpdateImportStatusService } from '../../lib/update_import_status_service';

aws.config.update({ region: process.env.SERVERLESS_REGION });

export function respond(event, cb) {
  debug('= updateImportStatus.action', JSON.stringify(event));
  const message = parse(event)[0];
  const updateImportStatusService = new UpdateImportStatusService(message);
  updateImportStatusService.updateListImportStatus()
    .then(list => notifyUser(message.importStatus, {listId: message.listId}))
    .then(data => cb(null, data))
    .catch(err => cb(err));
}

const importStatusTopicMapping = {
  success: 'LIST_IMPORT_SUCCEEDED',
  failed: 'LIST_IMPORT_FAILED'
};

function notifyUser(status, payload) {
  const type = importStatusTopicMapping[status];
  return type ? UserNotifier.notify(payload.userId, {type, data: payload}) : Promise.resolve(true);
}
