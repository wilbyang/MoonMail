'use strict';

import * as chai from 'chai';
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
const sinonChai = require('sinon-chai');
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { SentEmail, Report, Recipient } from 'moonmail-models';
import { EmailNotificationService } from './email_notification_service';
import * as bounce from './fixtures/bounce_notification.json';
import * as complaint from './fixtures/complaint_notification.json';
import * as delivery from './fixtures/delivery_notification.json';

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('EmailNotificationService', () => {
  let emailNotificationService;
  let getEmailStub;
  let updateEmailStub;
  let updateRecipientStub;
  let incrementBouncesStub;
  let incrementComplaintsStub;
  let incrementDeliveriesStub;
  const messageId = 'some-message-id';
  const recipientId = 'thatUserId';
  const listId = 'some-list-id';
  const status = 'sent';
  const sentEmail = {recipientId, messageId, listId, status};
  const bouncedEmail = {recipientId, messageId, listId, status: 'bounced'};

  beforeEach(() => {
    emailNotificationService = new EmailNotificationService(bounce);
    getEmailStub = sinon.stub(SentEmail, 'get').resolves(sentEmail);
    updateEmailStub = sinon.stub(SentEmail, 'update').resolves(bouncedEmail);
    updateRecipientStub = sinon.stub(Recipient, 'update').resolves(true);
    incrementBouncesStub = sinon.stub(Report, 'incrementBounces').resolves(true);
    incrementComplaintsStub = sinon.stub(Report, 'incrementComplaints').resolves(true);
    incrementDeliveriesStub = sinon.stub(Report, 'incrementDeliveries').resolves(true);
  });

  describe('#getSentEmail()', () => {
    it('returns the sent email', (done) => {
      emailNotificationService.getSentEmail().then((email) => {
        const args = SentEmail.get.lastCall.args;
        expect(args[0]).to.equal(bounce.mail.messageId);
        expect(email).to.deep.equal(sentEmail);
        done();
      });
    });
  });

  describe('#unsubscribeRecipient()', () => {
    context('when the notification is a bounce', () => {
      it('unsubscribes the recipient with bouncedAt timestamp', done => {
        emailNotificationService.unsubscribeRecipient().then(() => {
          const args = Recipient.update.lastCall.args;
          const updateParams = args[0];
          const listIdParam = args[1];
          const recipientIdParam = args[2];
          expect(updateParams).to.have.property('bouncedAt');
          expect(updateParams).to.have.property('status', Recipient.statuses.bounced);
          expect(listIdParam).to.equal(listId);
          expect(recipientIdParam).to.equal(recipientId);
          done();
        });
      });
    });

    context('when the notification is a complaint', () => {
      it('unsubscribes the recipient with complainedAt timestamp', done => {
        emailNotificationService = new EmailNotificationService(complaint);
        emailNotificationService.unsubscribeRecipient().then(() => {
          const args = Recipient.update.lastCall.args;
          const updateParams = args[0];
          const listIdParam = args[1];
          const recipientIdParam = args[2];
          expect(updateParams).to.have.property('complainedAt');
          expect(updateParams).to.have.property('status', Recipient.statuses.complaint);
          expect(listIdParam).to.equal(listId);
          expect(recipientIdParam).to.equal(recipientId);
          done();
        });
      });
    });
  });

  describe('#updateStatus()', () => {
    it('returns the updated sent email', (done) => {
      emailNotificationService.updateStatus().then((updatedEmail) => {
        expect(updatedEmail).to.deep.equal(bouncedEmail);
        done();
      });
    });

    context('when the notification is a bounce', () => {
      it('changes the sent email status to bounced', (done) => {
        emailNotificationService.updateStatus().then(() => {
          const args = SentEmail.update.lastCall.args;
          expect(args[0]).to.deep.equal({status: 'bounced'});
          expect(args[1]).to.equal(bounce.mail.messageId);
          done();
        });
      });
    });

    context('when the notification is a complaint', () => {
      it('changes the sent email status to complaint', (done) => {
        emailNotificationService = new EmailNotificationService(complaint);
        emailNotificationService.updateStatus().then(() => {
          const args = SentEmail.update.lastCall.args;
          expect(args[0]).to.deep.equal({status: 'complained'});
          expect(args[1]).to.equal(bounce.mail.messageId);
          done();
        });
      });
    });
  });

  describe('#incrementReportCount()', () => {
    context('when the notification is a bounce', () => {
      it('increments the bounces count', (done) => {
        emailNotificationService.incrementReportCount(sentEmail).then(() => {
          expect(incrementBouncesStub).to.have.been.calledWith(sentEmail.campaignId);
          done();
        });
      });
    });

    context('when the notification is a complaint', () => {
      it('increments the complaints count', (done) => {
        emailNotificationService = new EmailNotificationService(complaint);
        emailNotificationService.incrementReportCount(sentEmail).then(() => {
          expect(incrementComplaintsStub).to.have.been.calledWith(sentEmail.campaignId);
          done();
        });
      });
    });

    context('when the notification is a delivery', () => {
      it('increments the deliveries count', (done) => {
        emailNotificationService = new EmailNotificationService(delivery);
        emailNotificationService.incrementReportCount(sentEmail).then(() => {
          expect(incrementDeliveriesStub).to.have.been.calledWith(sentEmail.campaignId);
          done();
        });
      });
    });
  });

  afterEach(() => {
    getEmailStub.restore();
    updateEmailStub.restore();
    updateRecipientStub.restore();
    incrementBouncesStub.restore();
    incrementComplaintsStub.restore();
    incrementDeliveriesStub.restore();
  });
});
