'use strict';

import * as chai from 'chai';
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Report } from 'moonmail-models';
import { IncrementCampaignsClicksService } from './increment_campaigns_clicks_service';
import * as event from './fixtures/increment_campaign_clicks_event.json';
import * as sinonAsPromised from 'sinon-as-promised';

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('IncrementCampaignsClicksService', () => {
  let clicksService;
  const campaignsClicks = {
    some_campaign_id: 2,
    another_campaign_id: 1
  };

  before(() => {
    clicksService = new IncrementCampaignsClicksService(event.Records);
  });

  describe('#clicksByCampaign()', () => {
    it('returns the count of clicks by campaign', (done) => {
      for (let campaignId in campaignsClicks) {
        expect(clicksService.clicksByCampaign).to.deep.equal(campaignsClicks);
      }
      done();
    });
  });

  describe('#incrementCount()', () => {
    before(() => {
      sinon.stub(Report, 'incrementClicks');
    });

    it('should save the clicks count', done => {
      const campaignId = '123';
      const count = 5;
      clicksService.incrementCount(campaignId, count);
      expect(Report.incrementClicks.callCount).to.equal(1);
      expect(Report.incrementClicks).to.have.been.calledWithExactly(campaignId, count);
      done();
    });

    after(() => {
      Report.incrementClicks.restore();
    });
  });

  describe('#incrementAll()', () => {
    before(() => {
      sinon.stub(Report, 'incrementClicks').resolves('ok');
    });

    it('should save the clicks count', done => {
      clicksService.incrementAll().then(() => {
        expect(Report.incrementClicks.callCount).to.equal(2);
        Object.keys(campaignsClicks).forEach(campaignId => {
          let count = campaignsClicks[campaignId];
          expect(Report.incrementClicks).to.have.been.calledWithExactly(campaignId, count);
        });
        done();
      }).catch(err => done(err));
    });

    after(() => {
      Report.incrementClicks.restore();
    });
  });
});
