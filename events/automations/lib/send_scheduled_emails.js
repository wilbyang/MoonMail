import Promise from 'bluebird';
import { ScheduledEmail } from '../../lib/moonmail-models/src/models/scheduled_email';
import moment from 'moment';
import SendAutomationScheduledEmails from './send_automation_scheduled_emails';
import { logger } from '../../lib/index';

export default class SendScheduledEmails {
  static execute() {
    return ScheduledEmail.toBeSent()
      .then(scheduledEmails => this._sendScheduledEmails(scheduledEmails))
      .then(results => this._updateScheduledEmailsStatuses(results));
  }

  static _sendScheduledEmails(scheduledEmails) {
    const emailsByAutomation = this._emailsByAutomation(scheduledEmails);
    return Promise.map(emailsByAutomation,
      emails => SendAutomationScheduledEmails.execute(emails),
      {concurrency: 5}
    );
  }

  static _emailsByAutomation(scheduledEmails = []) {
    const byAutomation = scheduledEmails.reduce((total, email) => {
      try {
        const key = `${email.userId}${email.automationId}`;
        if (!total[key]) total[key] = [];
        total[key].push(email);
        return total;
      } catch (err) {
        return total;
      }
    }, {});
    return Object.values(byAutomation);
  }

  static _updateScheduledEmailsStatuses(deliveriesByAutomation = []) {
    const deliveries = deliveriesByAutomation.reduce((total, del) => total.concat(del), []);
    const updateArgs = deliveries.reduce((total, delivery) => {
      const args = this._buildUpdateArgs(delivery);
      return args ? total.concat(args) : total;
    }, []);
    logger().debug('Updating scheduled email statuses:', JSON.stringify(updateArgs));
    return Promise.map(updateArgs, args => ScheduledEmail.update(args, args.automationActionId, args.id).catch(), {concurrency: 2})
      .then(res => logger().debug(res))
      .catch(err => logger().debug('Error', err));
  }

  static _buildUpdateArgs(delivery = {}) {
    try {
      if (delivery.retryable) return null;
      const updateArgs = {id: delivery.email.id, automationActionId: delivery.email.automationActionId};
      delivery.error
        ? Object.assign(updateArgs, {status: 'error', sentAt: 0})
        : Object.assign(updateArgs, {status: 'sent', sentAt: moment().unix()});
      return updateArgs;
    } catch (err) {
      return null;
    }
  }
}
