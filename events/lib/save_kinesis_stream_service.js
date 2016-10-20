import { parse } from 'aws-event-parser';
import * as _ from 'lodash';

export class SaveKinesisStreamService {

  static create(kinesisStream, model) {
    return new SaveKinesisStreamService(kinesisStream, model);
  }

  constructor(kinesisStream, model) {
    this.kinesisStream = kinesisStream;
    this.model = model;
  }

  save() {
    return this._excludeInvalidRecords(this.streamData)
      .then(validRecords => this._deduplicateRecords(validRecords))
      .then(uniqueRecords => this._saveOpens(uniqueRecords));
  }

  get streamData() {
    return parse(this.kinesisStream);
  }

  _excludeInvalidRecords(records) {
    const validRecrods = records.filter(el => !!el[this.model.hashKey] && !!el[this.model.rangeKey]);
    return Promise.resolve(validRecrods);
  }

  _deduplicateRecords(records) {
    const uniqueRecords = _.uniqBy(records, (record) => {
      return record[this.model.hashKey] + record[this.model.rangeKey];
    });
    return Promise.resolve(uniqueRecords);
  }

  _saveOpens(records) {
    const itemBatches = _.chunk(records, 25);
    const savePromises = itemBatches.map(batch => this.model.saveAll(batch));
    return Promise.all(savePromises);
  }
}
