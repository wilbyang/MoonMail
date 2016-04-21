import uuid from 'uuid';
import db from '../../lib/dynamodb';

const TABLE_NAME = `${process.env.SERVERLESS_PROJECT}-lists-${process.env.SERVERLESS_STAGE}`;

export function getAll(userId, options = {}) {
  let params = {
    TableName: TABLE_NAME,
    IndexName: 'UserListsIndex'
  };

  let keyConditionExpression = 'userId = :userId and isDeleted = :isDeleted';
  let expressionAttributeValues = {
    ':userId': userId,
    ':isDeleted': false.toString()
  };

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

export function create(list) {
  list.id = uuid.v1();
  return db('put', {
    TableName: TABLE_NAME,
    Item: list
  }).then(() => list);
}

export function update(list) {
  return db('update', {
    TableName: TABLE_NAME,
    Key:{
      "id": list.id
    },
    UpdateExpression: "set listName = :listName, isDeleted = :isDeleted",
    ExpressionAttributeValues:{
      ":listName": list.listName,
      ":isDeleted": list.isDeleted.toString(),
    },
    ReturnValues:"ALL_NEW"
  }).then((data) => data.Attributes);
}

export function remove(id) {
  return db('delete', {
    TableName: TABLE_NAME,
    Key: { id: id }
  });
}

export function markAsDeleted(id){
  return db('update', {
    TableName: TABLE_NAME,
    Key:{
      "id": id
    },
    UpdateExpression: "set isDeleted = :isDeleted",
    ExpressionAttributeValues:{
      ":isDeleted": true.toString(),
    },
    ReturnValues:"ALL_NEW"
  }).then((data) => data.Attributes);
}
