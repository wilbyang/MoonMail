'use strict';

import { debug } from './index';
import { Report } from 'moonmail-models';
import * as async from 'async';

class IncrementCampaignsClicksService {
  constructor(kinesisRecords) {
    this.kinesisRecords = kinesisRecords;
  }

  incrementAll() {
    return new Promise((resolve, reject) => {
      async.forEachOf(this.clicksByCampaign, (count, cid, cb) => {
        this.incrementCount(cid, count)
          .then(() => cb())
          .catch(() => cb());
      }, err => {
        if (err) {
          debug('= IncrementCampaignsClicksService.incrementAll', 'Error incrementing clicks', err);
          reject(err);
        } else {
          debug('= IncrementCampaignsClicksService.incrementAll', 'Successfully incremented clicks');
          resolve('ok');
        }
      });
    });
  }

  incrementCount(campaignId, count = 1) {
    debug('= IncrementCampaignsClicksService.incrementCount', 'Campaign ID:', campaignId, 'Count:', count);
    return Report.incrementClicks(campaignId, count);
  }

  get clicksByCampaign() {
    if (this.kinesisRecords) {
      let clicksPerCampaign = {};
      for (let record of this.kinesisRecords) {
        let data = this._getRecordData(record);
        if (clicksPerCampaign[data.campaignId]) {
          clicksPerCampaign[data.campaignId] += 1;
        } else {
          clicksPerCampaign[data.campaignId] = 1;
        }
      }
      return clicksPerCampaign;
    }
  }

  _getRecordData(kisenisRecord) {
    const data = new Buffer(kisenisRecord.kinesis.data, 'base64').toString();
    return JSON.parse(data);
  }
}

module.exports.IncrementCampaignsClicksService = IncrementCampaignsClicksService;
