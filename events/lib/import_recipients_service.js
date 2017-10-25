import AWS from 'aws-sdk';
import Papa from 'papaparse';
import stripBom from 'strip-bom';
import { Recipient, List } from 'moonmail-models';
import base64url from 'base64-url';
import querystring from 'querystring';
import moment from 'moment';
import _ from 'lodash';
import { debug } from './index';
import UserNotifier from './user_notifier';

// TODO: Refactor me!
class ImportRecipientsService {

  constructor({ s3Event, importOffset = 0 }, s3Client, snsClient, lambdaClient, context) {
    this.s3Event = s3Event;
    this.importOffset = importOffset;
    this.processedItems = 0;
    this.bucket = s3Event.bucket.name;
    this.fileKey = querystring.unescape(s3Event.object.key);
    const file = this.fileKey.split('.');
    this.userId = file[0];
    this.listId = file[1];
    this.fileExt = file[file.length - 1];
    this.s3 = s3Client;
    this.corruptedEmails = [];
    this.recipients = [];
    this.totalRecipientsCount = 0;
    this.lambdaClient = lambdaClient;
    this.lambdaName = context.functionName;
    this.context = context;
    this.headerMapping = null;
    this.sns = snsClient;
    this.updateImportStatusTopicArn = process.env.UPDATE_IMPORT_STATUS_TOPIC_ARN;
  }

  get executionThreshold() {
    return 60000;
  }

  get maxBatchSize() {
    return 25;
  }

  // @deprecated
  get s3Client() {
    debug('= ImportRecipientsService.s3Client', 'Getting S3 client');
    if (!this.s3) {
      this.s3 = new AWS.S3({ region: process.env.SERVERLESS_REGION || 'us-east-1' });
    }
    return this.s3;
  }

  timeEnough() {
    return (this.context.getRemainingTimeInMillis() > this.executionThreshold);
  }

  importAll() {
    const importStatus = {
      listId: this.listId,
      userId: this.userId,
      fileName: this.fileKey,
      totalRecipientsCount: this.totalRecipientsCount,
      corruptedEmailsCount: this.corruptedEmails.length,
      corruptedEmails: this.corruptedEmails,
      importedCount: this.importOffset,
      importStatus: 'importing',
      createdAt: moment().unix()
    };
    return this._publishToSns(importStatus)
      .then(() => this.parseFile())
      .then((recipients) => {
        this.totalRecipientsCount = recipients.length || 0;
        this.recipients = recipients.filter(this.filterByEmail.bind(this));
        return this.saveRecipients();
      });
  }

  saveRecipients() {
    if (this.importOffset < this.recipients.length) {
      const recipientsBatch = this.recipients.slice(this.importOffset, this.importOffset + this.maxBatchSize);
      const deduplicatedRecipientsBatch = _.uniqBy(recipientsBatch, 'email');
      return Recipient.saveAll(deduplicatedRecipientsBatch)
        .then((data) => {
          this.importOffset += (data.UnprocessedItems && data.UnprocessedItems instanceof Array) ?
            (this.maxBatchSize - data.UnprocessedItems.length) : Math.min(this.maxBatchSize, recipientsBatch.length);
          this.processedItems += recipientsBatch.length;
          if (this.processedItems % 1000 === 0) this._notifyProgress(1000);
          return this.timeEnough() ? this.saveRecipients() : this.invokeLambda();
        }).catch((err) => new Promise((resolve, reject) => {
            debug('= ImportRecipientsService.saveRecipients', 'Error while saving recipients', err, err.stack);
            const importStatus = {
              listId: this.listId,
              userId: this.userId,
              fileName: this.fileKey,
              totalRecipientsCount: this.totalRecipientsCount,
              corruptedEmailsCount: this.corruptedEmails.length,
              corruptedEmails: this.corruptedEmails,
              importedCount: this.importOffset,
              importStatus: 'failed',
              finishedAt: moment().unix(),
              message: err.message,
              stackTrace: err.stack
            };
            this._publishToSns(importStatus)
              .then(() => reject(importStatus))
              .catch((e) => reject(importStatus));
          }));
    } else {
      return new Promise((resolve, reject) => {
        const importStatus = {
          listId: this.listId,
          userId: this.userId,
          fileName: this.fileKey,
          totalRecipientsCount: this.totalRecipientsCount,
          importedCount: this.importOffset,
          corruptedEmailsCount: this.corruptedEmails.length,
          corruptedEmails: this.corruptedEmails,
          importStatus: 'success',
          finishedAt: moment().unix()
        };
        debug('= ImportRecipientsService.saveRecipients', 'Saved recipients successfully', importStatus);
        this._saveMetadataAttributes()
          .then(() => this._publishToSns(importStatus))
          .then(() => resolve(importStatus))
          .catch(error => reject(error));
      });
    }
  }

  invokeLambda() {
    return new Promise((resolve, reject) => {
      debug('= ImportRecipientsService.invokeLambda', 'Invoking function again', this.lambdaName);
      const payload = { Records: [{ s3: this.s3Event }], importOffset: this.importOffset };
      const params = {
        FunctionName: this.lambdaName,
        InvocationType: 'Event',
        Payload: JSON.stringify(payload)
      };
      this.lambdaClient.invoke(params, (err, data) => {
        if (err) {
          debug('= ImportRecipientsService.invokeLambda', 'Error invoking lambda', err, err.stack);
          reject(err);
        } else {
          debug('= ImportRecipientsService.invokeLambda', 'Invoked successfully');
          resolve(data);
        }
      });
    });
  }

  parseFile() {
    return new Promise((resolve, reject) => {
      const params = { Bucket: this.bucket, Key: this.fileKey };
      debug('= ImportRecipientsService.parseFile', 'File', this.fileKey);
      this.s3.getObject(params, (err, data) => {
        if (err) {
          debug('= ImportRecipientsService.parseFile', 'Error while loading an S3 file', err, err.stack);
          reject(err);
        } else {
          debug('= ImportRecipientsService.parseFile', 'File metadata', data.Metadata);
          if (this.fileExt === 'csv') {
            this.headerMapping = JSON.parse(data.Metadata.headers);
            return this.parseCSV(data.Body.toString('utf8')).then(recipients => resolve(recipients)).catch(error => reject(error));
          } else {
            debug('= ImportRecipientsService.parseFile', `${this.fileExt} is not supported`);
            return reject(`${this.fileExt} is not supported`);
          }
        }
      });
    });
  }

  parseCSV(csvString) {
    return new Promise((resolve, reject) => {
      const headerMapping = this.headerMapping;
      const userId = this.userId;
      const listId = this.listId;
      const recipients = [];
      Papa.parse(stripBom(csvString), {
        header: true,
        //dynamicTyping: true,
        skipEmptyLines: true,
        step: (results, parser) => {
          try {
            if (results.errors.length > 0) {
              debug('= ImportRecipientsService.parseCSV', 'Error parsing line', JSON.stringify(results.errors));
            } else {
              const item = results.data[0];
              debug('= ImportRecipientsService.parseCSV', 'Parsing recipient', JSON.stringify(item), headerMapping);
              const newRecp = {
                userId,
                listId,
                metadata: {},
                status: Recipient.statuses.subscribed,
                isConfirmed: true,
                createdAt: moment().unix()
              };
              for (const key in headerMapping) {
                const newKey = headerMapping[key];
                if (newKey && newKey !== 'false') {
                  newRecp.metadata[newKey] = item[key];
                }
              }
              newRecp.email = newRecp.metadata.email.trim();
              delete newRecp.metadata.email;
              newRecp.id = base64url.encode(newRecp.email.toString());
              newRecp.subscriptionOrigin = Recipient.subscriptionOrigins.listImport;
              debug('= ImportRecipientsService.parseCSV', 'Parsed recipient', JSON.stringify(newRecp));
              if (newRecp.email) {
                recipients.push(newRecp);
              }
            }
          } catch (error) {
            debug('= ImportRecipientsService.parseCSV', 'Error parsing recipient', JSON.stringify(results.data[0]), headerMapping, error);
          }
        },
        complete: (results, parser) => resolve(recipients)
      });
    });
  }

  filterByEmail(recipient) {
    const email = recipient.email;
    if (this.validateEmail(email)) {
      return true;
    } else {
      this.corruptedEmails.push(email);
      return false;
    }
  }

  validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }

  _notifyProgress(recipientsAmount) {
    const payload = { listId: this.listId };
    return UserNotifier.notify(this.userId, { type: 'LIST_IMPORT_PROCESSED', data: payload });
  }

  _saveMetadataAttributes() {
    const metadataAttributes = Object.keys(this.recipients[0].metadata);
    return List.update({processed: false }, this.userId, this.listId)
      .then(_ => List.appendMetadataAttributes(metadataAttributes, {userId: this.userId, listId: this.listId}));
  }

  _publishToSns(message) {
    const topic = this.updateImportStatusTopicArn;
    return new Promise((resolve, reject) => {
      debug('= ImportRecipientsService._publishToSns', 'Sending message', topic, JSON.stringify(message));
      const params = {
        Message: JSON.stringify(message),
        TopicArn: topic
      };
      this.sns.publish(params, (err, data) => {
        if (err) {
          debug('= ImportRecipientsService._publishToSns', 'Error sending message', err);
          reject(err);
        } else {
          debug('= ImportRecipientsService._publishToSns', 'Message sent');
          resolve(data);
        }
      });
    });
  }
}

module.exports.ImportRecipientsService = ImportRecipientsService;
