'use strict';

import { debug } from './index';
import { IncrementerService } from './incrementer_service';
import { Campaign } from 'moonmail-models';

class IncrementCampaignsUnsubscriptionsService extends IncrementerService {
  constructor(records) {
    super(Campaign, 'unsubscribeCount', records);
  }

  get countByItem() {
    if (this.records) {
      const itemsByKey = this.records.map(item => JSON.stringify([item.userId, item.campaignId]));
      const stringifiedCount = itemsByKey.reduce((counter, item) => {
        counter[item] = counter.hasOwnProperty(item) ? counter[item] + 1 : 1;
        return counter;
      }, {});
      const itemsCount = Object.keys(stringifiedCount).map(key => [JSON.parse(key), stringifiedCount[key]]);
      return itemsCount;
    }
  }

}

module.exports.IncrementCampaignsUnsubscriptionsService = IncrementCampaignsUnsubscriptionsService;
