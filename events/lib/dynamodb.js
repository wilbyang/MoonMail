import BPromise from 'bluebird';
import { DynamoDB } from 'aws-sdk';

const dynamoConfig = {
  region:  process.env.AWS_REGION || 'us-east-1'
};

const client = new DynamoDB.DocumentClient(dynamoConfig);

export default (method, params) => {
  return BPromise.fromCallback(cb => client[method](params, cb));
}
