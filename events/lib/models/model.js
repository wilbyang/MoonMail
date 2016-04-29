'use strict';

import { debug } from './../index';
import { DynamoDB } from 'aws-sdk';

const dynamoConfig = {
  region: process.env.AWS_REGION || 'us-east-1'
};
const db = new DynamoDB.DocumentClient(dynamoConfig);

class Model {

  static _client(method, params) {
    return new Promise((resolve, reject) => {
      debug('Model._client', JSON.stringify(params));
      db[method](params, (err, data) => {
        if (err) {
          debug('= Model._client', method, 'Error', err);
          reject(err);
        } else {
          debug('= Model._client', method, 'Success');
          resolve(data);
        }
      });
    });
  }

 }

module.exports.Model = Model;
