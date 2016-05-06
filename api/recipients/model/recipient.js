import uuid from 'uuid';
import db from '../../lib/dynamodb';
import * as AWS from 'aws-sdk';
import Promise from 'bluebird';

const dynamoConfig = {
  region:  process.env.AWS_REGION || 'us-east-1'
};
const dbClient = new AWS.DynamoDB.DocumentClient(dynamoConfig);

AWS.config.region = process.env.SERVERLESS_REGION || 'us-east-1';

const TABLE_NAME = `${process.env.SERVERLESS_PROJECT}-recipients-${process.env.SERVERLESS_STAGE}`;

export function getAll(list_id, options = {}) {
  let params = {
    TableName: TABLE_NAME,
    IndexName: 'ListRecipientsIndex'
  };

  let keyConditionExpression = 'listId = :list_id';
  let expressionAttributeValues = {':list_id': list_id};

  if(options.status){
    keyConditionExpression = 'listId = :list_id and recipientStatus = :status';
    expressionAttributeValues = {
       ':list_id': list_id,
       ':status': options.status
    };
  }
  params.KeyConditionExpression = keyConditionExpression;
  params.ExpressionAttributeValues = expressionAttributeValues;

  if(options.limit){
    params.Limit = options.limit;
  }

  if(options.page){
    params.ExclusiveStartKey = options.page;
  }
  return db('query', params);
}

export function get(id) {
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: 'id = :id',
    ExpressionAttributeValues: {
       ':id': id
    }
  };
  return db('query', params).then(({ Items }) => {
    if(Items.length == 1){
      return Items[0];
    }else{
      return null;
    }
  });
}

export function create(recipient) {
  recipient.id = uuid.v1();
  return db('put', {
    TableName: TABLE_NAME,
    Item: recipient
  }).then(() => recipient);
}

export function update(recipient) {
  return db('put', {
    TableName: TABLE_NAME,
    Item: recipient
  }).then(() => recipient);
}

export function remove(id) {
  return db('delete', {
    TableName: TABLE_NAME,
    Key: { id: id }
  });
}

export function saveAll(recipients, options = {}) {
  return new Promise(function(resolve, reject) {
    const BATCH_SIZE = options.batch_size || 25;
    let allItems = recipients.map(r => {
      return {
        PutRequest: {Item: r}
      };
    });
    let importedCount = 0;
    let writeNextBatchCb = (err, data) => {
      if (err) {
        reject(err);
      } else {
        if(data.UnprocessedItems || allItems.length > 0){
          Array.prototype.push.apply(allItems, data.UnprocessedItems);
          let params = {RequestItems:{}};
          let batch = [];
          if(allItems.length >= BATCH_SIZE){
            batch = allItems.splice(0, BATCH_SIZE);
          }else if(allItems.length > 0){
            batch = allItems.splice(0, allItems.length);
          }else{
            resolve({imported_count: importedCount});
          }
          importedCount += batch.length;
          params.RequestItems[TABLE_NAME] = batch;
          dbClient.batchWrite(params, writeNextBatchCb);
        }else{
          resolve({imported_count: importedCount});
        }
      }
    };
    let batch = [];
    if(allItems.length > BATCH_SIZE){
      batch = allItems.splice(0, BATCH_SIZE);
    }else{
      batch = allItems.splice(0, allItems.length);
    }
    importedCount += batch.length;
    let params = {RequestItems:{}};
    params.RequestItems[TABLE_NAME] = batch;
    dbClient.batchWrite(params, writeNextBatchCb);
  });
}
