'use strict';

import * as chai from 'chai';
const chaiAsPromised = require('chai-as-promised');
import { expect } from 'chai';
import * as sinon from 'sinon';
import { IncrementClicksService } from './increment_clicks_service';
import * as event from './increment_clicks_event.json';

chai.use(chaiAsPromised);

describe('IncrementClicksService', () => {
  let linksService;
  const linkId = 'some_link_id';
  const campaignId = 'some_campaign_id';

  before(() => {
    linksService = new IncrementClicksService(event.Records);
  });

  describe('#clicksByLink()', () => {
    it('returns the count of clicks by link', (done) => {
      expect(linksService.clicksByLink).to.have.property(linkId);
      expect(linksService.clicksByLink[linkId]).to.have.property('count', 3);
      expect(linksService.clicksByLink[linkId]).to.have.property('campaignId', campaignId);
      done();
    });
  });
});
