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
