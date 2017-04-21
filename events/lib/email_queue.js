import { CloudWatch } from 'aws-sdk';
import { debug } from './index';
import { EnqueuedEmail } from './enqueued_email';
import { uncompressString } from './utils';

class EmailQueue {

  constructor(sqsClient, { url, name } = {}) {
    this.client = sqsClient;
    this.name = name;
    this.url = url;
    this.messages = new Map();
  }

  getOrCreateQueue() {
    return new Promise((resolve, reject) => {
      debug('= EmailQueue.getOrCreateQueue', 'Getting queue URL');
      this.getUrl()
        .then(resolve)
        .catch((err) => {
          if (err.code === 'AWS.SimpleQueueService.NonExistentQueue') {
            debug('= EmailQueue.getOrCreateQueue', 'Queue does not exist, creating it...');
            resolve(this._createQueue());
          } else {
            debug('= EmailQueue.getOrCreateQueue', 'Error while fetching the queue');
            debug('= EmailQueue.getOrCreateQueue', err, err.stack);
            reject(err);
          }
        });
    });
  }

  getUrl() {
    return new Promise((resolve, reject) => {
      if (this.url) {
        debug('= EmailQueue.getUrl', 'The url is already cached:', this.url);
        resolve(this.url);
      } else {
        debug('= EmailQueue.getUrl', 'Fetching url');
        this._fetchUrl().then(resolve, reject);
      }
    });
  }

  retrieveMessages() {
    return new Promise((resolve, reject) => {
      this.getOrCreateQueue().then((queueUrl) => {
        debug('= EmailQueue.retrieveMessages', 'Queue url fetched');
        const queryParams = this._retrieveMessageParams(queueUrl);
        this.client.receiveMessage(queryParams, (err, data) => {
          if (err) {
            debug('= EmailQueue.retrieveMessages', 'Error retrieving messages', err, err.stack);
            reject(err);
          } else {
            if (data.Messages) {
              debug('= EmailQueue.retrieveMessages', 'Got some messages', JSON.stringify(data));
              const enqueuedEmails = data.Messages.map((message) => {
                const canonicalMessage = JSON.parse(message.Body);
                const uncompressedBody = uncompressString(canonicalMessage.campaign.body);
                canonicalMessage.campaign.body = uncompressedBody;
                return new EnqueuedEmail(canonicalMessage, message.ReceiptHandle, message.MessageId);
              });
              this.messages = enqueuedEmails;
              resolve(enqueuedEmails);
            } else {
              debug('= EmailQueue.retrieveMessages', 'Empty queue');
              reject('EmptyQueue');
            }
          }
        });
      });
    });
  }

  removeMessage(receiptHandle) {
    return new Promise((resolve, reject) => {
      this.getOrCreateQueue().then((queueUrl) => {
        debug('= EmailQueue.removeMessage', 'Removing handle', receiptHandle);
        const params = {
          QueueUrl: queueUrl,
          ReceiptHandle: receiptHandle
        };
        this.client.deleteMessage(params, (err, data) => {
          if (err) {
            debug('= EmailQueue.removeMessage', 'Error removing', err);
            reject(err);
          } else {
            debug('= EmailQueue.removeMessage', 'Successfully removed messages');
            resolve(data);
          }
        });
      });
    });
  }

  removeMessages(batch) {
    return new Promise((resolve, reject) => {
      if (batch.length > 0) {
        this.getOrCreateQueue().then((queueUrl) => {
          debug('= EmailQueue.removeMessages', 'Deleting a batch of', batch.length, 'messages');
          const params = {
            Entries: batch,
            QueueUrl: queueUrl
          };
          this.client.deleteMessageBatch(params, (err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        });
      } else {
        resolve('Nothing to remove');
      }
    });
  }

  putMessage(payload) {
    return new Promise((resolve, reject) => {
      this.getOrCreateQueue().then((queueUrl) => {
        debug('= EmailQueue.putMessage', 'Inserting message', payload);
        const params = {
          MessageBody: JSON.stringify(payload),
          QueueUrl: queueUrl
        };
        this.client.sendMessage(params, (err, data) => {
          if (err) {
            debug('= EmailQueue.putMessage', 'Error inserting message', err);
            reject(err);
          } else {
            debug('= EmailQueue.putMessage', 'Message inserted');
            resolve(data);
          }
        });
      });
    });
  }

  purgeQueue() {
    return new Promise((resolve, reject) => {
      this.getOrCreateQueue().then((queueUrl) => {
        this.client.purgeQueue({ QueueUrl: queueUrl}, (err, data) => {
          if (err) {
            debug('= EmailQueue.purgeQueue', 'Error purging the queue', err);
            reject(err);
          } else {
            debug('= EmailQueue.purgeQueue', 'Queue purged successfully');
            resolve(data);
          }
        });
      });
    });
  }

  _retrieveMessageParams(queueUrl) {
    return {
      QueueUrl: queueUrl,
      VisibilityTimeout: 5,
      WaitTimeSeconds: 5,
      MaxNumberOfMessages: 10
    };
  }

  _fetchUrl() {
    return new Promise((resolve, reject) => {
      debug('= EmailQueue._fetchUrl', 'Fetching queue with name', this.name);
      const params = { QueueName: this.name };
      this.client.getQueueUrl(params, (err, data) => {
        if (err) {
          debug('= EmailQueue._fetchUrl', 'Error fetching queue url', err, err.stack);
          reject(err);
        } else {
          this.url = data.QueueUrl;
          debug('= EmailQueue._fetchUrl', 'Got url', this.url);
          resolve(this.url);
        }
      });
    });
  }

  _createQueue() {
    return new Promise((resolve, reject) => {
      debug('= EmailQueue._createQueue', 'Creating queue with name', this.name);
      // Increase retention period to 14 days dafault is 4 days
      // For more details visit:
      // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#createQueue-property
      // const params = { QueueName: this.name, Attributes: { "MessageRetentionPeriod": "1209600" } };

      const params = { QueueName: this.name };
      this.client.createQueue(params, (err, data) => {
        if (err) {
          debug('= EmailQueue._createQueue', 'Error creating queue with name', this.name, err, err.stack);
          reject(err);
        } else {
          debug('= EmailQueue._createQueue', 'Queue created', data.QueueUrl, 'Creating alarm');
          this._createAlarm(this.name)
            .then(() => resolve(data.QueueUrl))
            .catch(reject);
        }
      });
    });
  }

  _createAlarm(queueName) {
    return new Promise((resolve, reject) => {
      debug('= EmailQueue._createAlarm', 'Creating alarm for queue', queueName);
      const params = this._buildAlarmParams(queueName);
      const cloudwatch = this._buildCloudWatchClient();
      cloudwatch.putMetricAlarm(params, (err, data) => {
        if (err) {
          debug('= EmailQueue._createAlarm', 'Error creating alarm for queue', err);
          reject(err);
        } else {
          debug('= EmailQueue._createAlarm', 'Success creating alarm');
          resolve(data);
        }
      });
    });
  }

  _buildAlarmParams(queueName) {
    return {
      AlarmName: `${queueName}-populated-queue`,
      AlarmDescription: `SendEmails alarm for the queue ${queueName}`,
      Namespace: 'AWS/SQS',
      MetricName: 'ApproximateNumberOfMessagesVisible',
      Dimensions: [{
        Name: 'QueueName',
        Value: queueName
      }],
      Statistic: 'Average',
      Period: 60,
      EvaluationPeriods: 1,
      Threshold: 1,
      ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      AlarmActions: [process.env.SEND_EMAILS_TOPIC_ARN]
    };
  }

  _buildCloudWatchClient() {
    return new CloudWatch({
      region: process.env.SERVERLESS_REGION || 'us-east-1'
    });
  }
}

module.exports.EmailQueue = EmailQueue;
