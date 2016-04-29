'use strict';

import * as chai from 'chai';
const chaiAsPromised = require('chai-as-promised');
import { expect } from 'chai';
import { SendCampaignService } from './send_campaign_service';
const awsMock = require('aws-sdk-mock');
const AWS = require('aws-sdk-promise');

chai.use(chaiAsPromised);

describe('SendCampaignService', () => {
  let dbClient;
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
    dbClient = new AWS.DynamoDB.DocumentClient();
    awsMock.mock('DynamoDB.DocumentClient', 'get', {
      Item: campaignRecord
    });
    sendCampaignService = new SendCampaignService(id);
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

  after(() => {
    // awsMock.restore('DynamoDB.DocumentClient');
  });
});
