'use strict';

import { debug } from './../index';
import { Model } from './model';

const TABLE_NAME = process.env.LINKS_TABLE;

class Link extends Model {

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
    debug('= Link.incrementOpens', campaignId, count);
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

  static incrementClicks(campaignId, linkId, count = 1) {
    debug('= Link.incrementClicks', campaignId, linkId, count);
    const addParams = {
      Key: {
        id: campaignId
      },
      TableName: TABLE_NAME,
      UpdateExpression: 'ADD #linksList.#linkId.#attrName :clicksCount',
      ExpressionAttributeNames: {
        '#linksList': 'links',
        '#linkId': linkId,
        '#attrName': 'clicksCount'
      },
      ExpressionAttributeValues: {
        ':clicksCount': count
      }
    };
    return this._client('update', addParams);
  }
}

module.exports.Link = Link;
