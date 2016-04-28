'use strict';

import { debug } from './index';
import * as async from 'async';
import { SES } from 'aws-sdk';

class SendEmailService {

  constructor(queue, lambdaClient, lambdaName) {
    this.queue = queue;
    this.emailClient = null;
    this.lambdaClient = lambdaClient;
    this.lambdaName = lambdaName;
  }

  sendEnqueuedEmails() {
    return this.sendBatch()
      .then((batch) => this.deleteBatch(batch))
      .then(() => this.sendNextBatch());
  }

  sendNextBatch() {
    return new Promise((resolve, reject) => {
      debug('= SendEmailService.sendNextBatch', 'Invoking function again', this.lambdaName);
      const payload = { QueueUrl: this.queue.url };
      const params = {
        FunctionName: this.lambdaName,
        InvocationType: 'Event',
        Payload: JSON.stringify(payload)
      };
      this.lambdaClient.invoke(params, (err, data) => {
        if (err) {
          debug('= SendEmailService.sendNextBatch', 'Error invoking lambda', err, err.stack);
          reject(err);
        } else {
          debug('= SendEmailService.sendNextBatch', 'Invoked successfully');
          resolve(data);
        }
      });
    });
  }

  sendBatch() {
    debug('= SendEmailService.sendBatch', 'Sending batch...');
    return new Promise((resolve, reject) => {
      const sentEmailsHandles = new Array();
      this.queue.retrieveMessages()
        .then((enqueuedEmails) => {
          debug('= SendEmailService.sendBatch', 'Got', enqueuedEmails.length, 'messages');
          this.setEmailClient(enqueuedEmails[0]);
          async.each(enqueuedEmails, (email, callback) => {
            this.deliver(email)
              .then(() => {
                sentEmailsHandles.push({
                  ReceiptHandle: email.receiptHandle,
                  Id: email.messageId
                });
                callback();
              }).catch(callback);
          }, () => {
            resolve(sentEmailsHandles);
          });
        });
    });
  }

  deleteBatch(batch) {
    return this.queue.removeMessages(batch);
  }

  deliver(enqueuedEmail) {
    debug('= SendEmailService.deliver', 'Sending email', enqueuedEmail.receiptHandle);
    return new Promise((resolve, reject) => {
      this.emailClient.sendEmail(enqueuedEmail.toSesParams(), (err, data) => {
        if (err) {
          debug('= SendEmailService.deliver', 'Error sending email', err, err.stack);
          reject(err);
        } else {
          debug('= SendEmailService.deliver', 'Email sent');
          resolve(data);
        }
      });
    });
  }

  setEmailClient(enqueuedEmail) {
    debug('= SendEmailService.setEmailClient', 'Getting client');
    if (!this.emailClient) {
      debug('= SendEmailService.setEmailClient', 'Non existing client. Building one...');
      this.emailClient = new SES(this._sesClientParams(enqueuedEmail));
      return this.emailClient;
    }
  }

  _sesClientParams(enqueuedEmail) {
    debug('= SendEmailService._sesClientParams', JSON.stringify(enqueuedEmail.message.sender));
    return {
      accessKeyId: enqueuedEmail.message.sender.apiKey,
      secretAccessKey: enqueuedEmail.message.sender.apiSecret,
      region: enqueuedEmail.message.sender.region
    }
  }
}

module.exports.SendEmailService = SendEmailService;
