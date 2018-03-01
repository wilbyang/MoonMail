import * as _ from 'lodash';
import { Link } from 'moonmail-models';
import { DynamoStreamsAggregator } from './dynamo_streams_aggregator.js';
import { debug } from './index';

export class LinkClicksAggregatorService extends DynamoStreamsAggregator {

  static create(stream) {
    return new LinkClicksAggregatorService(stream, 'linkId', 'campaignId');
  }

  _excludeInvalidRecords(records) {
    return new Promise((resolve, reject) => {
      debug('= LinkClicksAggregatorService._excludeInvalidRecords', records);
      debug('= LinkClicksAggregatorService._excludeInvalidRecords', this.hashKey);
      const validRecords = records
        .filter(record => (record.eventName === 'INSERT'))
        .filter(record => record.dynamodb.NewImage.hasOwnProperty(this.hashKey))
        .filter(record => record.dynamodb.NewImage.hasOwnProperty('linkId'))
        .filter(record => record.dynamodb.NewImage.hasOwnProperty('recipientId'));
      return resolve(validRecords);
    });
  }

  _deduplicate(records) {
    return new Promise((resolve, reject) => {
      debug('= LinkClicksAggregatorService._deduplicate', records);
      const uniqueRecords = _.uniqBy(records, (record) => {
        return record.dynamodb.NewImage.linkId + record.dynamodb.NewImage.recipientId;
      });
      return resolve(uniqueRecords);
    });
  }

  _aggregate(records) {
    debug('= LinkClicksAggregatorService._aggregate', records);
    const recordsData = records.map(record => (record.dynamodb.NewImage));
    const aggregated = _.groupBy(recordsData, record => (record[this.aggregateBy].S));
    return Promise.resolve(aggregated);
  }

  _incrementCounters(aggregated) {
    debug('= LinkClicksAggregatorService._incrementCounters', JSON.stringify(aggregated));
    const linkIds = Object.keys(aggregated);
    const incrementPromises = linkIds.map(linkId => {
      const campaignId = aggregated[linkId][0].campaignId.S;
      return Link.incrementClicks(campaignId, linkId, aggregated[linkId].length)
        .catch((error) => {
          if ((error.message || '').match(/The document path provided in the update expression is invalid for update/)) {
            console.log("WARNING", 'Skipping error saving links stats due to a really unlikely case', JSON.stringify(aggregated));
            return Promise.resolve();
          }
          return Promise.reject(error);
        });
    });
    return Promise.all(incrementPromises);
  }
}
