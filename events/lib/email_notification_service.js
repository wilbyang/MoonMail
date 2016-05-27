'use strict';

import { debug } from './index';
import { SentEmail, Report } from 'moonmail-models';

class EmailNotificationService {

  constructor(notification) {
    this.messageId = notification.mail.messageId;
    this.notificationType = notification.notificationType.toLowerCase();
    this.sentEmail = null;
  }

  process() {
    debug('= EmailNotificationService.process', JSON.stringify(this.messageId));
    return this.updateStatus()
      .then(updatedEmail => this.incrementReportCount(updatedEmail));
  }

  getSentEmail() {
    debug('= EmailNotificationService.getSentEmail', this.messageId);
    return SentEmail.get(this.messageId);
  }

  updateStatus() {
    debug('= EmailNotificationService.updateStatus', this.notificationType);
    return SentEmail.update({status: this.newStatus}, this.messageId);
  }

  incrementReportCount(sentEmail) {
    debug('= EmailNotificationService.incrementReportCount', JSON.stringify(sentEmail));
    switch (this.notificationType) {
      case 'bounce':
        debug('= EmailNotificationService.incrementReportCount', 'Bounce');
        return Report.incrementBounces(sentEmail.campaignId);
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
    switch (this.notificationType) {
      case 'bounce':
        return 'bounced';
      case 'complaint':
        return 'complained';
      case 'delivery':
        return 'delivered';
      default:
        return null;
    }
  }
}

module.exports.EmailNotificationService = EmailNotificationService;
