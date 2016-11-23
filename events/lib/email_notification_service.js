'use strict';

import { Promise } from 'bluebird';
import { debug } from './index';
import { SentEmail, Report, Recipient } from 'moonmail-models';
import moment from 'moment';
import omitEmpty from 'omit-empty';

class EmailNotificationService {

  constructor(notification) {
    this.messageId = notification.mail.messageId;
    this.notification = notification;
    this.sentEmail = null;
  }

  process() {
    debug('= EmailNotificationService.process', JSON.stringify(this.messageId));
    return this.unsubscribeRecipient()
      .then(() => this.updateStatus())
      .then(updatedEmail => this.incrementReportCount(updatedEmail));
  }

  getSentEmail() {
    debug('= EmailNotificationService.getSentEmail', this.messageId);
    return SentEmail.get(this.messageId);
  }

  unsubscribeRecipient() {
    return this.getSentEmail()
      .then(sentEmail => {
        // There is no need to unubscribe recipient if
        // it is not a complaint or a hard bounce
        if (this._shouldUnsubscribe()) {
          const recipient = {status: this.newStatus};
          recipient[`${this.newStatus}At`] = moment().unix();
          return Recipient.update(omitEmpty(recipient), sentEmail.listId, sentEmail.recipientId);
        }
        return Promise.resolve({});
      });
  }

  updateStatus() {
    debug('= EmailNotificationService.updateStatus', this.notificationType);
    return SentEmail.update({status: this.newStatus}, this.messageId);
  }

  incrementReportCount(sentEmail) {
    debug('= EmailNotificationService.incrementReportCount', JSON.stringify(sentEmail));
    switch (this.notification.notificationType.toLowerCase()) {
      case 'bounce':
        const bounceType = this.notification.bounce.bounceType.toLowerCase();
        if (bounceType === 'permanent' || bounceType === 'undetermined') {
            debug('= EmailNotificationService.incrementReportCount', 'Bounce');
            return Report.incrementBounces(sentEmail.campaignId);
        }
        debug('= EmailNotificationService.incrementReportCount', 'Bounce', bounceType);
        return Report.incrementSoftBounces(sentEmail.campaignId);
      case 'complaint':
        debug('= EmailNotificationService.incrementReportCount', 'Complaint');
        return Report.incrementComplaints(sentEmail.campaignId);
      case 'delivery':
        debug('= EmailNotificationService.incrementReportCount', 'Delivery');
        return Report.incrementDeliveries(sentEmail.campaignId);
      default:
        return null;
    }
  }

  get newStatus() {
    switch (this.notification.notificationType.toLowerCase()) {
      case 'bounce': {
        const bounceType = this.notification.bounce.bounceType.toLowerCase();
        if (bounceType === 'permanent' || bounceType === 'undetermined') {
          return Recipient.statuses.bounced;
        }
        return `${Recipient.statuses.bounced}::${bounceType}`;
      }
      case 'complaint':
        return Recipient.statuses.complaint;
      default:
        return null;
    }
  }

  _isHardBounce() {
    if (this.notification.notificationType.toLowerCase() === 'bounce') {
      if (this.notification.bounce.bounceType.toLowerCase() === 'permanent') {
        return true;
      }
    }
    return false;
  }

  _isComplaint() {
    return this.notification.notificationType.toLowerCase() === 'complaint';
  }

  _shouldUnsubscribe() {
    return this._isHardBounce() || this._isComplaint();
  }

}

module.exports.EmailNotificationService = EmailNotificationService;
