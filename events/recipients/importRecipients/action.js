import AWS from 'aws-sdk';
import { ImportRecipientsService } from '../../lib/import_recipients_service';

const s3 = new AWS.S3({ region: process.env.SERVERLESS_REGION || 'us-east-1' });

export function respond(event, cb, context) {
  const lambda = new AWS.Lambda();
  const params = {
    s3Event: event.Records[0].s3,
    importOffset: event.importOffset
  };
  const importRecipientsService = new ImportRecipientsService(params, s3, lambda, context);
  importRecipientsService.importAll()
    .then(status => cb(null, status))
    .catch(status => cb(JSON.stringify(status)));
}
