import { Recipient, List } from 'moonmail-models';
import csvWriter from 'csv-write-stream';
import fs from 'fs';
import cuid from 'cuid';
import { S3 } from 'aws-sdk';
import { debug } from './index';
import moment from 'moment';

const bucketName = process.env.EXPORTS_BUCKET_NAME;
const s3bucket = new S3({params: {Bucket: bucketName}});

export default class ExportListService {

  static export(listId, userId) {
    return new ExportListService(listId, userId).export();
  }

  constructor(listId, userId) {
    this.listId = listId;
    this.userId = userId;
    this.csvFile = csvWriter();
    this.csvPath = '/tmp/out.csv';
    this.csvFile.pipe(fs.createWriteStream(this.csvPath));
    this.s3ObjectKey = `${cuid()}-${listId}.csv`;
  }

  export() {
    debug('= ExportListService.export', this.userId, this.listId);
    return List.get(this.userId, this.listId)
      .then(list => this._checkNoExportPending(list))
      .then(list => this._createExport(list))
      .then(() => this._writeRecipients())
      .then(() => this._uploadToS3())
      .then(() => this._getFileUrl())
      .then(url => this._completeExport(url))
      .catch(err => this._errorHandler(err));
  }

  _checkNoExportPending(list) {
    return new Promise((resolve, reject) => {
      debug('= ExportListService._checkNoExportPending', list);
      const listExports = list.exports || {};
      const pending = Object.keys(listExports).filter(key => (listExports[key].status && listExports[key].status === 'pending'));
      if (pending.length > 0) return reject('There are exports in progress');
      else return resolve(list);
    });
  }

  _createExport(list) {
    const listExports = list.exports || {};
    listExports[this.s3ObjectKey] = {status: 'pending', createdAt: moment().unix()};
    return List.update({exports: listExports}, this.userId, this.listId);
  }

  _completeExport(url) {
    return List.get(this.userId, this.listId)
      .then(list => this._doCompleteExport(list, url));
  }

  _doCompleteExport(list, url) {
    const listExports = list.exports || {};
    listExports[this.s3ObjectKey].url = url;
    listExports[this.s3ObjectKey].status = 'success';
    listExports[this.s3ObjectKey].finishedAt = moment().unix();
    return List.update({exports: listExports}, this.userId, this.listId);
  }

  _errorHandler(err) {
    debug('= ExportListService._errorHandler', err);
    return List.get(this.userId, this.listId)
      .then(list => this._exportFailed(list, err))
      .then(() => err);
  }

  _exportFailed(list, err) {
    const listExports = list.exports || {};
    if (listExports[this.s3ObjectKey]) {
      listExports[this.s3ObjectKey].status = 'failed';
      listExports[this.s3ObjectKey].finishedAt = moment().unix();
      return List.update({exports: listExports}, this.userId, this.listId);
    }
  }

  _writeRecipients(previousBatch) {
    if (!!previousBatch && !previousBatch.nextPage) {
      return this.csvFile.end();
    } else {
      return this._fetchRecipients(previousBatch)
        .then(recipients => this._recipientsToCSV(recipients))
        .then(recipients => this._writeRecipients(recipients));
    }
  }

  _uploadToS3() {
    return new Promise((resolve, reject) => {
      fs.readFile(this.csvPath, 'utf8', (err, data) => {
        if (err) return reject(err);
        const params = {Bucket: bucketName, Key: this.s3ObjectKey, Body: data};
        return resolve(s3bucket.putObject(params).promise());
      });
    });
  }

  _getFileUrl() {
    return new Promise((resolve, reject) => {
      const params = {Bucket: bucketName, Key: this.s3ObjectKey};
      const url = s3bucket.getSignedUrl('getObject', params);
      resolve(url);
    });
  }

  _recipientsToCSV(recipients) {
    recipients.items.map(recipient => this.csvFile.write(Object.assign({}, {email: recipient.email}, recipient.metadata, {status: recipient.status})));
    return recipients;
  }

  _fetchRecipients(previousBatch = {}) {
    const options = {limit: 1000};
    if (previousBatch.nextPage) options.page = previousBatch.nextPage;
    return Recipient.allBy('listId', this.listId, options);
  }

}
