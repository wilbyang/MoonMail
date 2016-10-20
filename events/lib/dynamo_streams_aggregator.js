import { debug } from './index';

export class DynamoStreamsAggregator {
  constructor(stream, aggregateBy, hashKey, rangeKey) {
    this.stream = stream;
    this.aggregateBy = aggregateBy;
    this.hashKey = hashKey;
    this.rangeKey = rangeKey;
  }

  increment() {
    debug('= DynamoStreamsAggregator.increment');
    return this._excludeInvalidRecords(this.stream.Records)
      .then(validRecords => this._deduplicate(validRecords))
      .then(uniqueRecords => this._aggregate(uniqueRecords))
      .then(aggregatedRecords => this._incrementCounters(aggregatedRecords));
  }

  _excludeInvalidRecords(records) {
    debug('= DynamoStreamsAggregator._excludeInvalidRecords');
    const validRecords = records.filter(record => record.dynamodb.NewImage.hasOwnProperty(this.hashKey));
    return Promise.resolve(validRecords);
  }

  _deduplicate(records) {
    debug('= DynamoStreamsAggregator._deduplicate', records);
    return Promise.resolve(records);
  }

  _incrementCounters(aggregatedRecords) {
    debug('= DynamoStreamsAggregator._incrementCounters');
    return Promise.resolve(aggregatedRecords);
  }
}
