'use strict';

import { debug } from './index';
import { EmailQueue } from './email_queue';
import { Email } from './email';
import { LinksParser } from './links_parser';

class PrecompileEmailService {

  constructor(sqsClient, emailParams) {
    this.emailParams = emailParams;
    this.apiHost = process.env.API_HOST;
    this.queue = new EmailQueue(sqsClient, {name: emailParams.sender.apiKey});
    this.email = new Email({
      fromEmail: emailParams.sender.emailAddress,
      to: emailParams.recipient.email,
      body: emailParams.campaign.body,
      subject: emailParams.campaign.subject,
      metadata: emailParams.recipient.metadata,
      recipientId: emailParams.recipient.id,
      campaignId: emailParams.campaign.id,
      listId: emailParams.recipient.listId
    },
    {footer: this._needsFooter(emailParams)});
  }

  composeEmail() {
    return new Promise((resolve, reject) => {
      debug('= PrecompileEmailService.composeEmail', 'Composing email');
      const parsedBodyPromise = this.composeBody();
      const parsedSubjectPromise = this.email.renderSubject();
      Promise.all([parsedBodyPromise, parsedSubjectPromise])
        .then((values) => {
          const parsedBody = values[0];
          const parsedSubject = values[1];
          let composedEmail = Object.assign({}, this.emailParams);
          Object.assign(composedEmail.campaign, { subject: parsedSubject, body: parsedBody});
          Object.assign(composedEmail.recipient, { unsubscribeUrl: this.email.unsubscribeUrl});
          debug('= PrecompileEmailService.composeEmail', 'Composed email', composedEmail);
          resolve(composedEmail);
        })
        .catch(reject);
    });
  }

  composeBody() {
    return this.email.renderBody()
      .then(body => this._addTracking(body, this.emailParams.campaign.id, this.emailParams.recipient.id));
  }

  _addTracking(body, campaignId, recipientId) {
    const linksParser = new LinksParser({apiHost: this.apiHost, campaignId, recipientId});
    return linksParser.appendRecipientIdToLinks(body)
      .then(parsedBody => linksParser.appendOpensPixel(parsedBody));
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

  _needsFooter(emailParams) {
    const userPlan = emailParams.userPlan;
    const freePlanRegex = /free/;
    return (!userPlan) || (userPlan.match(freePlanRegex)) || (userPlan === 'staff');
  }
}

module.exports.PrecompileEmailService = PrecompileEmailService;
