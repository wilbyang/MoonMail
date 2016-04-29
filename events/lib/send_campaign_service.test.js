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

  before(() => {
    dbClient = new AWS.DynamoDB.DocumentClient();
    awsMock.mock('DynamoDB.DocumentClient', 'get', {
      Item: {senderId, id, subject, userId, listIds, name, body}
    });
    sendCampaignService = new SendCampaignService();
  });

  describe('#buildCampaignObject()', () => {
    it('returns a plain object correctly formatted', (done) => {
      sendCampaignService.buildCampaignObject().then((campaign) => {
        expect(campaign).to.have.property('userId', userId);
        expect(campaign).to.have.deep.property('campaign.id', id);
        expect(campaign).to.have.deep.property('campaign.subject', subject);
        expect(campaign).to.have.deep.property('campaign.body', body);
        expect(campaign).to.have.deep.property('campaign.senderId', senderId);
        expect(campaign).to.have.deep.property('campaign.precompiled', false);
        expect(campaign).to.have.deep.property('listIds[0]', listIds[0]);
        done();
      });
    });
  });

  after(() => {
    awsMock.restore('DynamoDB.DocumentClient');
  });

});
