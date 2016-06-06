'use strict';

import { debug } from './index';
import { Sender } from 'moonmail-models';

class FetchSenderCredentialsService {

  constructor(userId, email, plan) {
    this.userId = userId;
    this.email = email;
    this.plan = plan;
  }

  getCredentials() {
    debug('= FetchSenderCredentialsService.getCredentials', 'Getting user credentials');
    return new Promise((resolve, reject) => {
      this._buildCredentials()
        .then((credentials) => {
          resolve(credentials);
        })
        .catch((err) => {
          debug('= FetchSenderCredentialsService.getCredentials', 'Error fetching credentials', err, err.stack);
          reject(err);
        });
    });
  }

  _buildCredentials() {
    return new Promise((resolve, reject) => {
      if (this.plan === 'free') {
        resolve({
          apiKey: process.env.DEFAULT_API_KEY,
          apiSecret: process.env.DEFAULT_API_SECRET,
          region: process.env.DEFAULT_REGION
        });
      } else {
        Sender.get(this.userId, this._emailAsRangeKey()).then(sender => {
          resolve({
            apiKey: sender.apiKey,
            apiSecret: sender.apiSecret,
            region: sender.region
          });
        })
        .catch(err => {
          reject(err);
        });
      }
    });
  }

  _emailAsRangeKey() {
    return new Buffer(this.email).toString('base64');
  }

}

module.exports.FetchSenderCredentialsService = FetchSenderCredentialsService;
