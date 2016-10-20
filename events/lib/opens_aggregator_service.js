import * as _ from 'lodash';
import { Report } from 'moonmail-models';
import { DynamoStreamsAggregator } from './dynamo_streams_aggregator.js';
import { debug } from './index';

export class OpensAggregatorService extends DynamoStreamsAggregator {

  static create(stream) {
    return new OpensAggregatorService(stream, 'campaignId', 'campaignId');
  }

  _excludeInvalidRecords(records) {
    return new Promise((resolve, reject) => {
      debug('= OpensAggregatorService._excludeInvalidRecords', records);
      const validRecords = records
        .filter(record => (record.eventName === 'INSERT'))
        .filter(record => record.dynamodb.NewImage.hasOwnProperty(this.hashKey));
      return resolve(validRecords);
    });
  }

  _deduplicate(records) {
    return new Promise((resolve, reject) => {
      debug('= OpensAggregatorService._deduplicate', records);
      const uniqueRecords = _.uniqBy(records, (record) => {
        return record.dynamodb.NewImage.campaignId + record.dynamodb.NewImage.recipientId;
      });
      return resolve(uniqueRecords);
    });
  }

  _aggregate(records) {
    debug('= OpensAggregatorService._aggregate', records);
    const recordsData = records.map(record => (record.dynamodb.NewImage));
    const aggregated = _.groupBy(recordsData, record => (record[this.aggregateBy].S));
    return Promise.resolve(aggregated);
  }

  _incrementCounters(aggregated) {
    debug('= OpensAggregatorService._incrementCounters', aggregated);
    const campaignIds = Object.keys(aggregated);
    const incrementPromises = campaignIds.map(campaignId => {
      return Report.incrementOpens(campaignId, aggregated[campaignId].length);
    });
    return Promise.all(incrementPromises);
  }
}
