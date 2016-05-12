'use strict';

import * as chai from 'chai';
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Link } from 'moonmail-models';
import { IncrementClicksService } from './increment_clicks_service';
import * as event from './increment_clicks_event.json';
import * as sinonAsPromised from 'sinon-as-promised';

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('IncrementClicksService', () => {
  let linksService;
  const linkIds = ['link_with_2_occurences', 'link_with_1_occurence'];
  const campaignId = 'some_campaign_id';

  before(() => {
    linksService = new IncrementClicksService(event.Records);
  });

  describe('#clicksByLink()', () => {
    it('returns the count of clicks by link', (done) => {
      expect(linksService.clicksByLink).to.have.property(linkIds[0]);
      expect(linksService.clicksByLink).to.have.property(linkIds[1]);
      expect(linksService.clicksByLink[linkIds[0]]).to.have.property('count', 2);
      expect(linksService.clicksByLink[linkIds[0]]).to.have.property('campaignId', campaignId);
      expect(linksService.clicksByLink[linkIds[1]]).to.have.property('count', 1);
      expect(linksService.clicksByLink[linkIds[1]]).to.have.property('campaignId', campaignId);
      done();
    });
  });

  describe('#incrementCount()', () => {
    before(() => {
      sinon.stub(Link, 'incrementClicks');
    });

    it('should save the clicks count', done => {
      linksService.incrementCount(campaignId, linkIds[0]);
      expect(Link.incrementClicks.callCount).to.equal(1);
      expect(Link.incrementClicks).to.have.been.calledWithExactly(campaignId, linkIds[0], 1);
      done();
    });

    after(() => {
      Link.incrementClicks.restore();
    });
  });

  describe('#incrementAll()', () => {
    before(() => {
      sinon.stub(Link, 'incrementClicks').resolves('ok');
    });

    it('should save the clicks count', done => {
      linksService.incrementAll().then(() => {
        expect(Link.incrementClicks.callCount).to.equal(2);
        expect(Link.incrementClicks).to.have.been.calledWithExactly(campaignId, linkIds[0], 2);
        expect(Link.incrementClicks).to.have.been.calledWithExactly(campaignId, linkIds[1], 1);
        done();
      });
    });

    after(() => {
      Link.incrementClicks.restore();
    });
  });
});
