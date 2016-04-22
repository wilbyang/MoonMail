'use strict';

import { debug } from './../index';
import { DynamoDB } from 'aws-sdk';

const dynamoConfig = {
  region: process.env.AWS_REGION || 'us-east-1'
};

const TABLE_NAME = process.env.LINKS_TABLE;
const client = new DynamoDB.DocumentClient(dynamoConfig);

class Link {

  static save(linkParams) {
    debug('= Link.save', linkParams);
    const itemParams = {
      TableName: TABLE_NAME,
      Item: linkParams
    };
    return this._client('put', itemParams);
  }

  static saveAll(linksParams) {
    debug('= Link.saveAll', linksParams);
    let itemsParams = {RequestItems: {}};
    itemsParams.RequestItems[TABLE_NAME] = linksParams.map((link) => {
      return {
        PutRequest: {Item: link}
      };
    });
    return this._client('batchWrite', itemsParams);
  }

  static incrementOpens(campaignId, count = 1) {
    debug('= Link.update', campaignId, count);
    const addParams = {
      Key: {
        id: campaignId
      },
      TableName: TABLE_NAME,
      AttributeUpdates: {
        opensCount: {
          Action: 'ADD',
          Value: count
        }
      }
    };
    return this._client('update', addParams);
  }

  static _client(method, params) {
    return new Promise((resolve, reject) => {
      debug('Link._client', JSON.stringify(params));
      client[method](params, (err, data) => {
        if (err) {
          debug('= Link._client', method, 'Error', err);
          reject(err);
        } else {
          debug('= Link._client', method, 'Success');
          resolve(data);
        }
      });
    });
  }
}

module.exports.Link = Link;
