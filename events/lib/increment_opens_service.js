'use strict';

import { debug } from './index';
import { Report } from 'moonmail-models';
import * as async from 'async';

class IncrementOpensService {
  constructor(kinesisRecords) {
    this.kinesisRecords = kinesisRecords;
  }

  incrementAll() {
    return new Promise((resolve, reject) => {
      async.forEachOf(this.opensByCampaign, (count, cid, cb) => {
        this.incrementCount(cid, count)
          .then(() => cb())
          .catch(err => cb(err));
      }, err => {
        if (err) {
          debug('= IncrementOpensService.incrementAll', 'Error incrementing opens', err);
          reject(err);
        } else {
          debug('= IncrementOpensService.incrementAll', 'Successfully incremented opens');
          resolve();
        }
      });
    });
  }

  incrementCount(campaignId, count = 1) {
    debug('= IncrementOpensService.incrementCount', 'Campaign ID:', campaignId, 'Count:', count);
    return Report.incrementOpens(campaignId, count);
  }

  get opensByCampaign() {
    if (this.kinesisRecords) {
      let opensPerCamapaign = {};
      for (let record of this.kinesisRecords) {
        let cid = this._getCampaignId(record);
        opensPerCamapaign[cid] = opensPerCamapaign[cid] ? opensPerCamapaign[cid] + 1 : 1;
      }
      return opensPerCamapaign;
    }
  }

  _getCampaignId(kisenisRecord) {
    return kisenisRecord.kinesis.partitionKey;
  }
}

module.exports.IncrementOpensService = IncrementOpensService;
