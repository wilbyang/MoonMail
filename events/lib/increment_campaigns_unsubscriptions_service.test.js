import * as chai from 'chai';
const sinonChai = require('sinon-chai');
import * as sinon from 'sinon';
import { IncrementCampaignsUnsubscriptionsService } from './increment_campaigns_unsubscriptions_service';
import * as sinonAsPromised from 'sinon-as-promised';

const expect = chai.expect;
chai.use(sinonChai);

describe('IncrementCampaignsUnsubscriptionsService', () => {
  let incrementerService;
  const listId = 'my-list';
  const campaignId = 'my-campaign';
  const recipientId = 'my-recipient';
  const userId = 'my-user';
  const records = [{listId, campaignId, recipientId, userId}];

  before(() => {
    incrementerService = new IncrementCampaignsUnsubscriptionsService(records);
  });

  describe('#countByItem()', () => {
    it('should return a multidimensional array of campaign occurences count', done => {
      const countByItem = incrementerService.countByItem;
      expect(countByItem).to.have.lengthOf(1);
      const firstItem = countByItem[0];
      expect(firstItem[0]).to.deep.equal([campaignId]);
      expect(firstItem[1]).to.equal(1);
      done();
    });
  });
});
