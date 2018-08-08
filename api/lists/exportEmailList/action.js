'use strict';

import { List } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import { ApiErrors } from '../../lib/errors';
import AWS from 'aws-sdk';

AWS.config.region = process.env.SERVERLESS_REGION || 'us-east-1';
const lambda = new AWS.Lambda();

export function respond(event, cb) {
  debug('= exportEmailList.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    if (event.listId) {
      List.get(decoded.sub, event.listId)
        .then(list => checkNoExportPending(list))
        .then(() => invokeExportLambda(decoded.sub, event.listId, event.fields))
        .then(() => cb(null, 'Export started'))
        .catch(e => cb(ApiErrors.response(e)));
    } else {
      return cb(ApiErrors.response('No list specified'));
    }
  }).catch(err => cb(ApiErrors.response(err), null));
}

function checkNoExportPending(list) {
  return new Promise((resolve, reject) => {
    const listExports = list.exports || {};
    const pending = Object.keys(listExports).filter(key => (listExports[key].status && listExports[key].status === 'pending'));
    if (pending.length > 0) return reject('There are exports in progress');
    else return resolve(list);
  });
}

function invokeExportLambda(userId, listId, fields) {
  const params = {
    FunctionName: process.env.EXPORT_FUNCTION_NAME,
    InvocationType: 'Event',
    Payload: JSON.stringify({userId, listId, fields})
  };
  return lambda.invoke(params).promise();
}
