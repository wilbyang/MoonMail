import * as async from 'async';
import { debug } from './index';

class IncrementerService {
  constructor(model, attribute, records) {
    this.records = records;
    this.model = model;
    this.attribute = attribute;
  }

  incrementAll() {
    return new Promise((resolve, reject) => {
      async.each(this.countByItem, (itemCount, cb) => {
        let hashKey;
        let rangeKey;
        let count;
        [hashKey, rangeKey, count] = this._getItemData(itemCount);
        this.incrementCount(count, hashKey, rangeKey)
          .then(() => cb())
          .catch(err => cb(err));
      }, err => {
        if (err) {
          debug('= IncrementerService.incrementAll', 'Error incrementing opens', err);
          reject(err);
        } else {
          debug('= IncrementerService.incrementAll', 'Successfully incremented opens');
          resolve();
        }
      });
    });
  }

  incrementCount(count, hash, range) {
    debug('= IncrementerService.incrementCount', this.attribute, count, hash, range);
    return this.model.increment(this.attribute, count, hash, range);
  }

  get countByItem() {
    throw new TypeError('Must override method');
  }

  _getItemData(itemCount) {
    const key = itemCount[0];
    const count = itemCount[1];
    return [key[0], key[1], count];
  }
}

module.exports.IncrementerService = IncrementerService;
