import cuid from 'cuid';
import moment from 'moment';
import Joi from 'joi';
import { BaseModel } from 'moonmail-models';

export default class ListModel extends BaseModel {
  static get tableName() {
    return process.env.LISTS_TABLE;
  }

  static get hashKey() {
    return 'userId';
  }

  static get rangeKey() {
    return 'id';
  }

  static get createSchema() {
    return Joi.object({
      userId: Joi.string().required(),
      id: Joi.string().default(cuid()),
      createdAt: Joi.number().default(moment().unix()),
      importStatus: Joi.object(),
      isDelete: Joi.string().default(false.toString()),
      name: Joi.string().required(),
      // Not sure if this should be required
      senderId: Joi.string()
    });
  }

  static createFileImportStatus(userId, listId, file, status) {
    const addParams = {
      Key: {
        userId,
        id: listId
      },
      TableName: this.tableName,
      UpdateExpression: 'SET #importStatus.#file = :newStatus',
      ExpressionAttributeNames: {
        '#importStatus': 'importStatus',
        '#file': file
      },
      ExpressionAttributeValues: {
        ':newStatus': status
      }
    };
    return this._client('update', addParams);
  }

  static appendMetadataAttributes(metadataAttributes = [], { listId, userId, list }) {
    return (list ? Promise.resolve(list) : this.get(userId, listId))
      .then((emailList) => {
        const oldMetadata = emailList.metadataAttributes || [];
        const newMetadata = [...new Set(oldMetadata.concat(metadataAttributes))];
        return (oldMetadata.length < newMetadata.length)
          ? this.update({ metadataAttributes: newMetadata }, emailList.userId, emailList.id)
          : emailList;
      });
  }
}
