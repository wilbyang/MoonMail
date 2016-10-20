import * as _ from 'lodash';
import { Report } from 'moonmail-models';
import { DynamoStreamsAggregator } from './dynamo_streams_aggregator.js';
import { debug } from './index';

export class CampaignClicksAggregatorService extends DynamoStreamsAggregator {

  static create(stream) {
    return new CampaignClicksAggregatorService(stream, 'campaignId', 'campaignId');
  }

  _excludeInvalidRecords(records) {
    return new Promise((resolve, reject) => {
      debug('= CampaignClicksAggregatorService._excludeInvalidRecords', records);
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
      debug('= CampaignClicksAggregatorService._deduplicate', records);
      const uniqueRecords = _.uniqBy(records, (record) => {
        return record.dynamodb.NewImage.linkId + record.dynamodb.NewImage.recipientId;
      });
      return resolve(uniqueRecords);
    });
  }

  _aggregate(records) {
    debug('= CampaignClicksAggregatorService._aggregate', records);
    const recordsData = records.map(record => (record.dynamodb.NewImage));
    const aggregated = _.groupBy(recordsData, record => (record[this.aggregateBy].S));
    return Promise.resolve(aggregated);
  }

  _incrementCounters(aggregated) {
    debug('= CampaignClicksAggregatorService._incrementCounters', aggregated);
    const campaignIds = Object.keys(aggregated);
    const incrementPromises = campaignIds.map(campaignId => {
      return Report.incrementClicks(campaignId, aggregated[campaignId].length);
    });
    return Promise.all(incrementPromises);
  }
}
