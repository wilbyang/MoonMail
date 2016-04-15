'use strict';

import { debug } from './index';
import * as async from 'async';

class SendEmailService {

  constructor(queue, emailClient, lambdaClient, lambdaName) {
    this.queue = queue;
    this.emailClient = emailClient;
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
}

module.exports.SendEmailService = SendEmailService;
