'use strict';

import { Model } from './model';

class Campaign extends Model {

  static get tableName() {
    return process.env.CAMPAIGNS_TABLE;
  }
}

module.exports.Campaign = Campaign;
