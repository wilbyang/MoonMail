import cuid from 'cuid';
import moment from 'moment';
import omitEmpty from 'omit-empty';
import { List } from 'moonmail-models';
import BaseModelMixin from './BaseModelMixin';

// TODO: Improve me, extract changes to the upstream mm-model
export default class ListModel extends List {
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

  static saveAll(items) {
    if (items.length === 0) return Promise.resolve({});
    const itemsToSave = items.map(item => Object.assign({}, { id: cuid(), createdAt: moment().unix() }, item));
    return super.saveAll(itemsToSave).then(() => itemsToSave);
  }
}
