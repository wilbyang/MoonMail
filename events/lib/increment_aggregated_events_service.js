import { strip } from 'eskimo-stripper';
import { IncrementerService } from './incrementer_service';
import { TimeAggregatorService } from './time_aggregator_service';

class IncrementAggregatedEventsService extends IncrementerService {
  static create(records, model) {
    return new IncrementAggregatedEventsService(records, model);
  }

  constructor(records, model) {
    super(model, 'count', records);
  }

  get countByItem() {
    if (this.records) {
      const records = this.records.filter(record => record.eventName === 'INSERT')
        .map(record => strip(record.dynamodb.NewImage));
      const aggregatedData = TimeAggregatorService.aggregate(records, [15, 'm'], {
        groupByAttrs: ['campaignId'],
        eventName: 'count'
      });
      const aggregatedByItem = aggregatedData.map(item => [[item.campaignId, item.timestamp], item.count]);
      return aggregatedByItem;
    }
  }

}

module.exports.IncrementAggregatedEventsService = IncrementAggregatedEventsService;
