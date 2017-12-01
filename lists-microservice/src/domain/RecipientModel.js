import Promise from 'bluebird';
import { Recipient } from 'moonmail-models';
import cuid from 'cuid';
import moment from 'moment';
import omitEmpty from 'omit-empty';
import chunkArray from '../lib/utils/chunkArray';
import BaseModelMixin from './BaseModelMixin';


// TODO: Improve me, extract changes to the upstream mm-model
export default class RecipientModel extends Recipient {
  static async find(hash, range, options = {}) {
    const result = await this.get(hash, range, options);
    if (Object.keys(result).length === 0) return Promise.reject(new Error('Item not found'));
    return result;
  }

  // To be ported to the upstream Model
  static update(params, hash, range) {
    if (Object.keys(params).length === 0) return Promise.resolve({});
    return super.update(params, hash, range);
  }

  static create(item) {
    return this.save(item);
  }

  static save(item) {
    const toSaveItem = omitEmpty(Object.assign({}, { id: cuid(), createdAt: moment().unix() }, item));
    return this.save(toSaveItem).then(() => toSaveItem);
  }

  static batchCreate(items) {
    return this.saveAll(items);
  }

  // TODO: Improve me, retry only unprocessed items
  static saveAll(items) {
    if (items.length === 0) return Promise.resolve({});
    const itemsToSave = items.map(item => Object.assign({}, { id: cuid(), createdAt: moment().unix() }, item));
    return super.saveAll(itemsToSave)
      .then((data) => {
        if (data.UnprocessedItems) {
          if (Object.keys(data.UnprocessedItems).length > 0) return Promise.reject(new Error('Unprocessed items'));
        }
        return data;
      });
  }

  static saveBatch(items) {
    return Promise.resolve(chunkArray(items, 25))
      .then(itemsChunks => Promise.map(itemsChunks, itms => this.saveAll(itms), { concurrency: 1 }));
  }
}

