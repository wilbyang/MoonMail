'use strict';

import AWS from 'aws-sdk';
import { debug } from './index';
import csv from 'csv-string';
import { Recipient } from 'moonmail-models';
import base64url from 'base64-url';

class ImportRecipientsService {

  constructor({s3Event, importOffset = 0 }, lambdaClient, context) {
    this.s3Event = s3Event;
    this.importOffset = importOffset;
    this.bucket = s3Event.bucket.name;
    this.fileKey = s3Event.object.key;
    const file = this.fileKey.split('.');
    this.listId = file[0];
    this.fileExt = file[file.length - 1];
    this.s3 = null;
    this.corruptedEmails = [];
    this.recipients = [];
    this.totalRecipientsCount = 0;
    this.lambdaClient = lambdaClient;
    this.lambdaName = context.functionName;
    this.context = context;
  }

  get executionThreshold() {
    return 60000;
  }

  get maxBatchSize() {
    return 25;
  }

  get s3Client() {
    debug('= ImportRecipientsService.s3Client', 'Getting S3 client');
    if (!this.s3) {
      this.s3 = new AWS.S3({region: process.env.SERVERLESS_REGION || 'us-east-1'});
    }
    return this.s3;
  }

  timeEnough() {
    return (this.context.getRemainingTimeInMillis() > this.executionThreshold);
  }

  importAll() {
    return this.parseFile().then(recipients => {
      this.totalRecipientsCount = recipients.length || 0;
      this.recipients = recipients.filter(this.filterByEmail.bind(this));
      return this.saveRecipients();
    });
  }

  saveRecipients() {
    if (this.importOffset < this.recipients.length) {
      const recipientsBatch = this.recipients.slice(this.importOffset, this.importOffset + this.maxBatchSize);
      return Recipient.saveAll(recipientsBatch)
      .then(data => {
        if (this.timeEnough()) {
          if (data.UnprocessedItems && data.UnprocessedItems instanceof Array) {
            this.importOffset += (this.maxBatchSize - data.UnprocessedItems.length);
          } else {
            this.importOffset += Math.min(this.maxBatchSize, recipientsBatch.length);
          }
          return this.saveRecipients();
        } else {
          if (data.UnprocessedItems && data.UnprocessedItems instanceof Array) {
            this.importOffset += (this.maxBatchSize - data.UnprocessedItems.length);
          } else {
            this.importOffset += Math.min(this.maxBatchSize, recipientsBatch.length);
          }
          debug('= ImportRecipientsService.saveRecipients', 'Not enough time left. Invoking lambda');
          return this.invokeLambda();
        }
      }).catch(err => {
        debug('= ImportRecipientsService.saveRecipients', 'Error while saving recipients', err, err.stack);
        const importStatus = {
          listId: this.listId,
          totalRecipientsCount: this.totalRecipientsCount,
          corruptedEmailsCount: this.corruptedEmails.length,
          corruptedEmails: this.corruptedEmails,
          importedCount: this.importOffset,
          importStatus: 'FAILED',
          updatedAt: new Date().toString(),
          message: err.message,
          stackTrace: err.stack
        };
        Promise.reject(importStatus);
      });
    } else {
      const importStatus = {
        listId: this.listId,
        totalRecipientsCount: this.totalRecipientsCount,
        importedCount: this.importOffset,
        corruptedEmailsCount: this.corruptedEmails.length,
        corruptedEmails: this.corruptedEmails,
        importStatus: 'SUCCESS',
        updatedAt: new Date().toString()
      };
      debug('= ImportRecipientsService.saveRecipients', 'Saved recipients successfully', importStatus);
      Promise.resolve(importStatus);
    }
  }

  invokeLambda() {
    return new Promise((resolve, reject) => {
      debug('= ImportRecipientsService.invokeLambda', 'Invoking function again', this.lambdaName);
      const payload = { Records: [{s3: this.s3Event}], importOffset: this.importOffset };
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
      const params = {Bucket: this.bucket, Key: this.fileKey};
      this.s3Client.getObject(params, (err, data) => {
        if (err) {
          debug('= ImportRecipientsService.parseFile', 'Error while loading an S3 file', err, err.stack);
          reject(err);
        } else {
          if (this.fileExt === 'csv') {
            const recipients = this.parseCSV(data.Body.toString('utf8'));
            resolve(recipients);
          } else {
            debug('= ImportRecipientsService.parseFile', `${this.fileExt} is not supported`);
            reject(`${this.fileExt} is not supported`);
          }
        }
      });
    });
  }

  parseCSV(csvString) {
    const pairs = csv.parse(csvString);
    return pairs.map(item => (
      {
        id: base64url.encode(item[0]),
        listId: this.listId,
        email: item[0],
        metadata: {
          firstName: item[1],
          lastName: item[2]
        },
        recipientStatus: 'NORMAL',
        isConfirmed: true
      }
    ));
  }

  filterByEmail(recipient) {
    const email = recipient.email;
    if (/\S+@\S+\.\S+/.test(email)) {
      return true;
    } else {
      this.corruptedEmails.push(email);
      return false;
    }
  }
}

module.exports.ImportRecipientsService = ImportRecipientsService;
