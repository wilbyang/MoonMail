'use strict';

import { debug } from './index';
import { Recipient } from 'moonmail-models';
import * as async from 'async';
import Promise from 'bluebird';
import Redis from 'ioredis';

class AttachListRecipientsService {
  constructor(snsClient, attachRecipientsListMessage, lambdaClient, context) {
    this.snsClient = snsClient;
    this.attachRecipientsListMessage = attachRecipientsListMessage;
    this.listId = attachRecipientsListMessage.listId;
    this.lambdaClient = lambdaClient;
    this.lambdaName = context.functionName;
    this.context = context;
    this.redisClient = AttachListRecipientsService._buildRedisClient();
  }

  get executionThreshold() {
    return 60000;
  }

  get batchSize() {
    return 250;
  }

  attachRecipientsList(nextPage = {}) {
    debug('= AttachListRecipientsService.attachRecipientsList', this.listId, nextPage);
    return this._attachRecipientsBatch(this.listId, nextPage)
      .then(nextPage => this._attachNextBatch(this.listId, nextPage));
  }

  _attachRecipientsBatch(listId, options = {}) {
    debug('= AttachListRecipientsService._attachRecipientsBatch', listId, JSON.stringify(options));
    return new Promise((resolve, reject) => {
      const next = {};
      this._getRecipientsBatch(listId, options)
        .then(result => {
          if (result.nextPage) {
            next.page = result.nextPage;
          }
          return this._publishRecipients(result.items);
        })
        .then(() => resolve(next));
    });
  }

  _attachNextBatch(listId, next) {
    return new Promise((resolve, reject) => {
      if (next && next.hasOwnProperty('page')) {
        if (this._timeEnough()) {
          debug('= AttachListRecipientsService._attachNextBatch', 'Attaching next batch', JSON.stringify(next));
          resolve(this.attachRecipientsList(next));
        } else {
          debug('= AttachListRecipientsService._attachNextBatch', 'Not time enough for next batch, invoking lambda...');
          this._disconnectRedis();
          return this._invokeLambda(next);
        }
      } else {
        debug('= AttachListRecipientsService._attachNextBatch', 'No more batches');
        this._disconnectRedis();
        resolve(true);
      }
    });
  }

  _getRecipientsBatch(listId, options = {}) {
    debug('= AttachListRecipientsService.attachRecipients', `Getting recipients for ${listId}`);
    const subscribedCondition = { filters: { status: { eq: Recipient.statuses.subscribed } } };
    const recipientOptions = Object.assign(options, subscribedCondition);
    recipientOptions.limit = this.batchSize;
    return Recipient.allBy('listId', listId, recipientOptions);
  }

  _publishRecipients(recipients) {
    debug('= AttachListRecipientsService._publishRecipients', 'Publishing a batch of recipients');
    return new Promise((resolve) => {
      async.each(recipients, (recipient, cb) => {
        this._publishRecipient(recipient)
          .then(() => cb())
          .catch(err => {
            debug('= AttachListRecipientsService._publishRecipients',
              'Couldn\'t publish recipient', JSON.stringify(recipient), err);
            cb();
          });
      }, () => resolve(true));
    });
  }

  _publishRecipient(recipient) {
    const recipientEmail = recipient.email;
    const campaignId = this.attachRecipientsListMessage.campaign.id;
    return this._cache(campaignId, recipientEmail).then((shouldExecute) => {
      if (shouldExecute) {
        return this._doPublishRecipient(recipient);
      }
      return Promise.resolve({});
    });
  }


  _doPublishRecipient(recipient) {
    debug('= AttachListRecipientsService._doPublishRecipient', JSON.stringify(recipient));
    return new Promise((resolve, reject) => {
      const recipientMessage = this._buildRecipientMessage(recipient);
      const params = {
        TopicArn: process.env.PRECOMPILE_EMAIL_TOPIC_ARN,
        Message: JSON.stringify(recipientMessage)
      };
      this.snsClient.publish(params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  _invokeLambda(nextPage) {
    return new Promise((resolve, reject) => {
      debug('= AttachListRecipientsService._invokeLambda', 'Invoking function again', this.lambdaName);
      const payload = {
        Records: [{
          Sns: {
            Message: {
              sender: this.attachRecipientsListMessage.sender,
              campaign: this.attachRecipientsListMessage.campaign,
              userId: this.attachRecipientsListMessage.userId,
              listId: this.listId
            }
          }
        }],
        batchOffset: nextPage
      };
      debug('= AttachListRecipientsService._invokeLambda', 'Payload', JSON.stringify(payload));
      const params = {
        FunctionName: this.lambdaName,
        InvocationType: 'Event',
        Payload: JSON.stringify(payload)
      };
      this.lambdaClient.invoke(params, (err, data) => {
        if (err) {
          debug('= AttachListRecipientsService._invokeLambda', 'Error invoking lambda', err, err.stack);
          reject(err);
        } else {
          debug('= AttachListRecipientsService._invokeLambda', 'Invoked successfully');
          resolve(data);
        }
      });
    });
  }

  _timeEnough() {
    return (this.context.getRemainingTimeInMillis() > this.executionThreshold);
  }

  _buildRecipientMessage(recipient) {
    debug('= AttachListRecipientsService._buildRecipientMessage', JSON.stringify(recipient));
    return Object.assign({}, this.attachRecipientsListMessage, { recipient });
  }

  // TODO: Consider to move to it's own class if need to be used elsewhere
  _cache(campaignId, recipientEmail) {
    debug('= AttachListRecipientsService._cache()', campaignId, recipientEmail);
    const client = this.getRedisClient();
    return client.sadd(campaignId, recipientEmail)
      .then((addedToSet) => {
        if (addedToSet === 1) {
          debug('= AttachListRecipientsService._cache()', 'Cache miss', campaignId, recipientEmail);
          // Expire keyin 20 minutes
          client.expire(campaignId, 60 * 20);
          return Promise.resolve(true);
        }
        debug('= AttachListRecipientsService._cache()', 'Cache hit', campaignId, recipientEmail);
        return Promise.resolve(false);
      }).catch((_) => {
        debug('= AttachListRecipientsService._cache()', 'Error with redis, skipping');
        return Promise.resolve(true);
      });
  }

  getRedisClient() {
    return this.redisClient;
  }

  static _buildRedisClient() {
    return new Redis({host: process.env.REDIS_ENDPOINT_ADDRESS,
      port: process.env.REDIS_ENDPOINT_PORT,
      password: process.env.REDIS_PASSWORD,
      connectTimeout: 50,
      keyPrefix: 'campaign:rcpt_cache:',
      dropBufferSupport: true,
      //showFriendlyErrorStack: true,
      retryStrategy: (_) => {
        // Not to reconnect on errors
        return false;
      },
      reconnectOnError: (_) => {
        return false;
      }
    });
  }

  _disconnectRedis() {
    this.redisClient.disconnect();
  }
}

module.exports.AttachListRecipientsService = AttachListRecipientsService;
