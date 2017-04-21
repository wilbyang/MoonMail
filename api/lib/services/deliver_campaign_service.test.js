import * as chai from 'chai';
import * as sinon from 'sinon';
import { expect } from 'chai';
import Promise from 'bluebird';
import { Campaign, List } from 'moonmail-models';
import 'sinon-as-promised';
import { DeliverCampaignService } from './deliver_campaign_service';
import { compressString } from '../utils';

const awsMock = require('aws-sdk-mock');
const AWS = require('aws-sdk');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

describe('DeliverCampaignService', () => {
  let snsClient = 'hahaha';
  let deliverCampaignService;
  const userId = 'some-user-id';
  const senderId = 'ca654';
  const subject = 'my campaign subject';
  const listIds = ['ca43546'];
  const name = 'my campaign';
  const body = 'my campaign body';
  const compressedBody = compressString(body);
  const updatedBody = 'New updated body';
  const compressedUpdatedBody = compressString(updatedBody);
  const campaignId = 'some-campaign-id';
  const freeUserPlan = 'free';
  const campaign = {userId, senderId, subject, listIds, name, body, id: campaignId, status: 'draft'};
  const updatedCampaign = {userId, senderId, subject, listIds, name, body: updatedBody, id: campaignId, status: 'draft'};
  const nonReadyCampaign = {userId, subject, name, body: updatedBody, id: campaignId};

  describe('#sendCampaign', () => {
    before(() => {
      awsMock.mock('SNS', 'publish', {ReceiptHandle: 'STRING_VALUE'});
      snsClient = new AWS.SNS();
    });

    context('when the user is not allowed to send more campaigns', () => {
      before(() => {
        deliverCampaignService = new DeliverCampaignService(snsClient, {campaignId, userId, userPlan: freeUserPlan});
        sinon.stub(Campaign, 'sentLastNDays').resolves(deliverCampaignService.maxMonthlyCampaigns + 1);
      });

      it('rejects the promise', done => {
        const sendCampaignPromise = deliverCampaignService.sendCampaign();
        expect(sendCampaignPromise).to.be.rejectedWith('User can\'t send more campaigns').notify(done);
      });

      after(() => {
        Campaign.sentLastNDays.restore();
      });
    });

    context('when the user is not allowed to send more campaigns the same day', () => {
      before(() => {
        deliverCampaignService = new DeliverCampaignService(snsClient, {campaignId, userId, userPlan: freeUserPlan});
        sinon.stub(Campaign, 'sentLastNDays').resolves(deliverCampaignService.maxDailyCampaigns + 1);
      });

      it('rejects the promise', done => {
        const sendCampaignPromise = deliverCampaignService.sendCampaign();
        expect(sendCampaignPromise).to.be.rejectedWith(`You can send only ${deliverCampaignService.maxDailyCampaigns} campaigns a day`).notify(done);
      });

      after(() => {
        Campaign.sentLastNDays.restore();
      });
    });

    context('when the user is not allowed to send to the total of recipients', () => {
      before(() => {
        deliverCampaignService = new DeliverCampaignService(snsClient, {campaignId, userId, userPlan: freeUserPlan});
        sinon.stub(Campaign, 'sentLastNDays').resolves(deliverCampaignService.maxDailyCampaigns - 1);
        sinon.stub(Campaign, 'get').resolves(campaign);
        sinon.stub(List, 'get').resolves({userId, id: listIds[0], name: 'Some list', subscribedCount: 251});
      });

      it('rejects the promise', done => {
        deliverCampaignService.sendCampaign().catch((error) => {
          expect(error).to.equal('You can send campaigns up to 250 subscribers');
          done();
        });
      });

      after(() => {
        List.get.restore();
        Campaign.get.restore();
        Campaign.sentLastNDays.restore();
      });
    });

    context('when the campaign is not ready to be sent', () => {
      before(() => {
        deliverCampaignService = new DeliverCampaignService(snsClient, {campaignId, userId, userPlan: freeUserPlan});
        sinon.stub(Campaign, 'sentLastNDays').resolves(deliverCampaignService.maxDailyCampaigns - 1);
        sinon.stub(Campaign, 'get').resolves(nonReadyCampaign);
        sinon.stub(List, 'get').resolves({userId, id: listIds[0], name: 'Some list', subscribedCount: 25});
      });

      it('rejects the promise', done => {
        const sendCampaignPromise = deliverCampaignService.sendCampaign();
        expect(sendCampaignPromise).to.be.rejectedWith('Campaign not ready to be sent').notify(done);
      });

      after(() => {
        Campaign.get.restore();
        List.get.restore();
        Campaign.sentLastNDays.restore();
      });
    });

    context('when only campaign id and user id were provided', () => {
      before(() => {
        sinon.stub(Campaign, 'get').resolves(campaign);
        deliverCampaignService = new DeliverCampaignService(snsClient, {campaignId, userId, userPlan: freeUserPlan});
        sinon.stub(deliverCampaignService, '_updateCampaignStatus').resolves(true);
        sinon.stub(Campaign, 'sentLastNDays').resolves(deliverCampaignService.maxDailyCampaigns - 1);
        sinon.stub(List, 'get').resolves({userId, id: listIds[0], name: 'Some list', subscribedCount: 25});
      });

      it('fetches the campaign from DB and sends it to the topic', done => {
        deliverCampaignService.sendCampaign().then(result => {
          const args = Campaign.get.lastCall.args;
          expect(args[0]).to.equal(userId);
          expect(args[1]).to.equal(campaignId);
          const snsPayload = JSON.parse(snsClient.publish.lastCall.args[0].Message);
          expect(snsPayload).to.have.property('userId', userId);
          expect(snsPayload).to.have.deep.property('campaign.id', campaignId);
          expect(snsPayload).to.have.deep.property('campaign.subject', subject);
          expect(snsPayload).to.have.deep.property('campaign.body', compressedBody);
          expect(snsPayload).to.have.deep.property('campaign.senderId', senderId);
          expect(snsPayload).to.have.deep.property('campaign.listIds');
          expect(snsPayload).to.have.deep.property('campaign.precompiled', false);
          done();
        })
        .catch(err => done(err));
      });

      after(() => {
        Campaign.get.restore();
        Campaign.sentLastNDays.restore();
        List.get.restore();
        deliverCampaignService._updateCampaignStatus.restore();
      });
    });

    context('when a campaign object was also provided', () => {
      before(() => {
        sinon.stub(Campaign, 'update').resolves(updatedCampaign);
        deliverCampaignService = new DeliverCampaignService(snsClient, {campaign, campaignId, userId, userPlan: 'plan'});
        sinon.stub(deliverCampaignService, '_updateCampaignStatus').resolves(true);
        sinon.stub(Campaign, 'sentLastNDays').resolves(deliverCampaignService.maxDailyCampaigns - 1);
        sinon.stub(List, 'get').resolves({userId, id: listIds[0], name: 'Some list', subscribedCount: 25});
      });

      it('fetches the campaign from DB and sends it to the topic', (done) => {
        deliverCampaignService.sendCampaign().then(result => {
          const args = Campaign.update.lastCall.args;
          expect(args[1]).to.equal(userId);
          expect(args[2]).to.equal(campaignId);
          const snsPayload = JSON.parse(snsClient.publish.lastCall.args[0].Message);
          expect(snsPayload).to.have.property('userId', userId);
          expect(snsPayload).to.have.deep.property('campaign.id', campaignId);
          expect(snsPayload).to.have.deep.property('campaign.subject', subject);
          expect(snsPayload).to.have.deep.property('campaign.body', compressedUpdatedBody);
          expect(snsPayload).to.have.deep.property('campaign.senderId', senderId);
          expect(snsPayload).to.have.deep.property('campaign.listIds');
          expect(snsPayload).to.have.deep.property('campaign.precompiled', false);
          done();
        })
        .catch(err => done(err));
      });

      after(() => {
        Campaign.sentLastNDays.restore();
        List.get.restore();
        Campaign.update.restore();
      });
    });

    after(() => {
      awsMock.restore('SNS');
      deliverCampaignService._updateCampaignStatus.restore();
    });
  });
});
