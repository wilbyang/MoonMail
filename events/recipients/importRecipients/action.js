import AWS from 'aws-sdk';
import { ImportRecipientsService } from '../../lib/import_recipients_service';

export function respond(event, cb, context) {
  const lambda = new AWS.Lambda();
  const params = {
    s3Event: event.Records[0].s3,
    importOffset: event.importOffset
  };
  const importRecipientsService = new ImportRecipientsService(params, lambda, context);
  importRecipientsService.importAll().then(status => cb(null, status))
  .catch(status => cb(JSON.stringify(status)));
}
