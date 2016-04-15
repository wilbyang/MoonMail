'use strict';

import { debug } from './index';
import { EmailQueue } from './email_queue';
import { Email } from './email';

class PrecompileEmailService {

  constructor(sqsClient, emailParams) {
    this.emailParams = emailParams;
    this.queue = new EmailQueue(sqsClient, {name: emailParams.sender.apiKey});
    this.email = new Email({
      fromEmail: emailParams.sender.emailAddress,
      to: emailParams.recipient.email,
      body: emailParams.campaign.body,
      subject: emailParams.campaign.subject,
      metadata: emailParams.recipient.metadata
    });
  }

  composeEmail() {
    return new Promise((resolve, reject) => {
      debug('= PrecompileEmailService.composeEmail', 'Composing email');
      const parsedBodyPromise = this.email.renderBody();
      const parsedSubjectPromise = this.email.renderSubject();
      Promise.all([parsedBodyPromise, parsedSubjectPromise])
        .then((values) => {
          const parsedBody = values[0];
          const parsedSubject = values[1];
          let composedEmail = Object.assign({}, this.emailParams);
          Object.assign(composedEmail.campaign, { subject: parsedSubject, body: parsedBody});
          debug('= PrecompileEmailService.composeEmail', 'Composed email', composedEmail);
          resolve(composedEmail);
        })
        .catch(reject);
    });
  }

  enqueueEmail() {
    return new Promise((resolve, reject) => {
      debug('= PrecompileEmailService.enqueueEmail()', 'Enqueuing email');
      this.composeEmail()
        .then((composedEmail) => {
          debug('= PrecompileEmailService.enqueueEmail', 'Got the composed email', composedEmail);
          resolve(this.queue.putMessage(composedEmail));
        })
        .catch((err) => {
          debug('= PrecompileEmailService.enqueueEmail', 'Some error occurred');
          reject(err);
        });
    });
  }
}

module.exports.PrecompileEmailService = PrecompileEmailService;
