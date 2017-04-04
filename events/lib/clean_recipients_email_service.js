import axios from 'axios';
import base64url from 'base64-url';
import { debug } from './index';
import { Recipient } from 'moonmail-models';

const INVALID_CODES = ['INVALID', 'UKN', 'DISPOSABLE', 'ROLE'];

class CleanRecipientsEmailService {

  static async cleanAndUpdate(recipients) {
    return await new CleanRecipientsEmailService(recipients).cleanAndUpdate();
  }

  constructor(recipients) {
    this.recipients = recipients;
    this.cleanEmailsEndpointUrl = process.env.CLEAN_EMAILS_ENDPOINT;
  }

  cleanAndUpdate() {
    const emailsWithIds = this.recipients
      .map(recipient => ({ email: recipient.email, id: recipient.listId }))
      .filter(emailListId => !!emailListId.email); // Safe check, just in case.

    return this._doClean(emailsWithIds)
      .then(cleaningResults => this._updateRecipients(cleaningResults.data.result));
  }

  async _doClean(emailsWithIds) {
    return axios.post(this.cleanEmailsEndpointUrl, { emails: emailsWithIds })
      .catch((error) => {
        debug('= CleanRecipientsEmailService._doClean', error);
        return Promise.resolve({ data: { result: [{ success: false, code: -1 }] } });
      });
  }

  async _updateRecipients(cleaningResults) {
    const updates = cleaningResults
      .filter(result => result.success && INVALID_CODES.indexOf(result.code) != -1)
      .map((result) => {
        const listId = result.id;
        const email = result.email;
        const id = base64url.encode(email);
        return Recipient.update({ status: Recipient.statuses.bounced }, listId, id);
      });
    return await Promise.all(updates);
  }
}

module.exports.CleanRecipientsEmailService = CleanRecipientsEmailService;
