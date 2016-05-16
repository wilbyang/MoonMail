'use strict';

import * as chai from 'chai';
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Campaign } from 'moonmail-models';
import { SendCampaignService } from './send_campaign_service';
import * as sinonAsPromised from 'sinon-as-promised';
const awsMock = require('aws-sdk-mock');
const AWS = require('aws-sdk-promise');

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('SendCampaignService', () => {
  let snsClient;
  let sendCampaignService;
  const senderId = 'ca654';
  const id = 'ca213';
  const subject = 'my campaign subject';
  const userId = 'ca7654';
  const listIds = ['ca43546'];
  const name = 'my campaign';
  const body = 'my campaign body';
  const campaignRecord = {senderId, id, subject, userId, listIds, name, body};

  before(() => {
    sendCampaignService = new SendCampaignService(snsClient, id, userId);
  });

  describe('#buildCampaignMessage()', () => {
    it('returns a plain object correctly formatted', (done) => {
      sendCampaignService.buildCampaignMessage(campaignRecord).then((campaignMessage) => {
        expect(campaignMessage).to.have.property('userId', userId);
        expect(campaignMessage).to.have.deep.property('campaign.id', id);
        expect(campaignMessage).to.have.deep.property('campaign.subject', subject);
        expect(campaignMessage).to.have.deep.property('campaign.body', body);
        expect(campaignMessage).to.have.deep.property('campaign.senderId', senderId);
        expect(campaignMessage).to.have.deep.property('campaign.precompiled', false);
        expect(campaignMessage).to.have.deep.property('listIds[0]', listIds[0]);
        done();
      });
    });
  });

  describe('#sendCampaign()', () => {
    beforeEach(() => {
      sinon.stub(Campaign, 'get').resolves(campaignRecord);
      awsMock.mock('SNS', 'publish', (params, cb) => {
        if (params.hasOwnProperty('Message') && params.hasOwnProperty('TopicArn')) {
          cb(null, {ReceiptHandle: 'STRING_VALUE'});
        } else {
          cb('Invalid params');
        }
      });
      snsClient = new AWS.SNS();
      sendCampaignService = new SendCampaignService(snsClient, id, userId);
    });

    it('gets the correct campaign from DB', (done) => {
      sendCampaignService.sendCampaign().then(() => {
        expect(Campaign.get).to.have.been.calledWithExactly(userId, id);
        done();
      });
    });

    it('publishes the campaign canonical message to the correct SNS topic', (done) => {
      sendCampaignService.sendCampaign().then((result) => {
        expect(snsClient.publish.callCount).to.equal(1);
        expect(result).to.have.property('ReceiptHandle');
        done();
      });
    });

    afterEach(() => {
      awsMock.restore('SNS');
      Campaign.get.restore();
    });
  });
});
