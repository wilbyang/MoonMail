'use strict';

import { debug } from './index';
import { Link } from 'moonmail-models';
import * as async from 'async';

class IncrementClicksService {
  constructor(kinesisRecords) {
    this.kinesisRecords = kinesisRecords;
  }

  incrementAll() {
    return new Promise((resolve, reject) => {
      async.forEachOf(this.clicksByLink, (data, lid, cb) => {
        this.incrementCount(data.campaignId, lid, data.count)
          .then(() => cb())
          .catch(() => cb());
      }, err => {
        if (err) {
          debug('= IncrementClicksService.incrementAll', 'Error incrementing clicks', err);
          reject(err);
        } else {
          debug('= IncrementClicksService.incrementAll', 'Successfully incremented clicks');
          resolve('ok');
        }
      });
    });
  }

  incrementCount(campaignId, linkId, count = 1) {
    debug('= IncrementClicksService.incrementCount', 'Campaign ID:', campaignId, 'Count:', count);
    return Link.incrementClicks(campaignId, linkId, count);
  }

  get clicksByLink() {
    if (this.kinesisRecords) {
      let clicksPerLink = {};
      for (let record of this.kinesisRecords) {
        let data = this._getRecordData(record);
        if (clicksPerLink[data.linkId]) {
          clicksPerLink[data.linkId].count += 1;
        } else {
          clicksPerLink[data.linkId] = {
            campaignId: data.campaignId,
            count: 1
          };
        }
      }
      return clicksPerLink;
    }
  }

  _getRecordData(kisenisRecord) {
    const data = new Buffer(kisenisRecord.kinesis.data, 'base64').toString();
    return JSON.parse(data);
  }
}

module.exports.IncrementClicksService = IncrementClicksService;
