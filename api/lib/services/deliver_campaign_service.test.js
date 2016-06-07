'use strict';

import * as chai from 'chai';
import * as sinon from 'sinon';
import { expect } from 'chai';
import { DeliverCampaignService } from './deliver_campaign_service';
import { Campaign } from 'moonmail-models';
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
  const updatedBody = 'New updated body';
  const campaignId = 'some-campaign-id';
  const campaign = {userId, senderId, subject, listIds, name, body, id: campaignId};
  const updatedCampaign = {userId, senderId, subject, listIds, name, body: updatedBody, id: campaignId};
  const nonReadyCampaign = {userId, subject, name, body: updatedBody, id: campaignId};

  describe('#sendCampaign', () => {
    before(() => {
      awsMock.mock('SNS', 'publish', {ReceiptHandle: 'STRING_VALUE'});
      snsClient = new AWS.SNS();
    });

    context('when the campaign is not ready to be sent', () => {
      before(() => {
        sinon.stub(Campaign, 'get').resolves(nonReadyCampaign);
        deliverCampaignService = new DeliverCampaignService(snsClient, {campaignId, userId});
      });

      it('rejects the promise', done => {
        const sendCampaignPromise = deliverCampaignService.sendCampaign();
        expect(sendCampaignPromise).to.be.rejectedWith('Campaign not ready to be sent').notify(done);
      });

      after(() => {
        Campaign.get.restore();
      });
    });

    context('when only campaign id and user id were provided', () => {
      before(() => {
        sinon.stub(Campaign, 'get').resolves(campaign);
        deliverCampaignService = new DeliverCampaignService(snsClient, {campaignId, userId});
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
          expect(snsPayload).to.have.deep.property('campaign.body', body);
          expect(snsPayload).to.have.deep.property('campaign.senderId', senderId);
          expect(snsPayload).to.have.deep.property('campaign.listIds');
          expect(snsPayload).to.have.deep.property('campaign.precompiled', false);
          done();
        })
        .catch(err => done(err));
      });

      after(() => {
        Campaign.get.restore();
      });
    });

    context('when a campaign object was also provided', () => {
      before(() => {
        sinon.stub(Campaign, 'update').resolves(updatedCampaign);
        deliverCampaignService = new DeliverCampaignService(snsClient, {campaign, campaignId, userId});
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
          expect(snsPayload).to.have.deep.property('campaign.body', updatedBody);
          expect(snsPayload).to.have.deep.property('campaign.senderId', senderId);
          expect(snsPayload).to.have.deep.property('campaign.listIds');
          expect(snsPayload).to.have.deep.property('campaign.precompiled', false);
          done();
        })
        .catch(err => done(err));
      });

      after(() => {
        Campaign.update.restore();
      });
    });

    after(() => {
      awsMock.restore('SNS');
    });
  });
});
