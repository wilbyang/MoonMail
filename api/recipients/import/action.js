import AWS from 'aws-sdk';
import uuid from 'uuid';
import csv from 'csv-string';
import { saveAll } from '../model/recipient';
import { DEBUG } from '../../lib/logger';

export function respond(event, cb){
  const s3Event = event.Records[0].s3;
  const bucket = s3Event.bucket.name;
  const fileKey = s3Event.object.key;
  const file = fileKey.split('.');
  const listId = file[0];
  const fileExt = file[1];
  const s3 = new AWS.S3();
  const params = {Bucket: bucket, Key: fileKey};
  s3.getObject(params, function(err, data) {
    if (!err){
      let import_emails = [];
      let corrupted_emails = [];
      const eregex = /\S+@\S+\.\S+/;
      let filterByEmail = (recipient) => {
        let email = recipient.email;
        if (eregex.test(email)) {
          return true;
        } else {
          corrupted_emails.push(email);
          return false;
        }
      };
      if(fileExt === 'csv'){
        const pairs = csv.parse(data.Body.toString('utf8'));
        import_emails = pairs.map(item => {
          return {
            id: uuid.v1(),
            listId: listId,
            email: item[0],
            firstName:  item[1],
            lastName:  item[2],
            recipientStatus: 'NORMAL',
            isConfirmed: true
          }
        });
        import_emails.filter(filterByEmail);
        saveAll(import_emails).then(importData => {
          //update status
          let importStatus = {
            list_id: listId,
            total_recipients_count: pairs.length,
            imported_recipients_count: importData.imported_count,
            corrupted_emails_count: corrupted_emails.length,
            corrupted_emails: corrupted_emails,
            import_status: 'SUCCESS',
            updated_at: new Date().toString()
          };
          DEBUG(importStatus);
          return cb(null);
        }).catch(e => {
          //update status
          let importStatus = {
            list_id: listId,
            total_recipients_count: pairs.length,
            corrupted_emails_count: corrupted_emails.length,
            corrupted_emails: corrupted_emails,
            import_status: 'FAILED',
            updated_at: new Date().toString(),
            message: e.message,
            stack_trace: e.stack
          };
          DEBUG(importStatus);
          DEBUG(e);
          return cb(e);
        });
      }else{
        DEBUG(`${fileExt} is not supported`);
        return cb(`${fileExt} is not supported`, null);
      }

    }else{
      DEBUG(err, err.stack);
      return cb(err.stack);
    }
  });
}
