'use strict';

import { debug } from './../index';
import { DynamoDB } from 'aws-sdk';

const dynamoConfig = {
  region: process.env.AWS_REGION || 'us-east-1'
};
const db = new DynamoDB.DocumentClient(dynamoConfig);

class Model {

  static save(params) {
    debug('= Model.save', params);
    const itemParams = {
      TableName: this.tableName,
      Item: params
    };
    return this._client('put', itemParams);
  }

  static get(key) {
    debug('= Model.get', key);
    const params = {
      TableName: this.tableName,
      Key: {
        id: key
      }
    };
    return this._client('get', params);
  }

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

  static get tableName() {
    throw new Error('No table name defined');
  }

 }

module.exports.Model = Model;
