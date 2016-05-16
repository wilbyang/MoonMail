'use strict';

import * as chai from 'chai';
import { respond } from './action';
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { Campaign } from 'moonmail-models';

const expect = chai.expect;

describe('deleteCampaign', () => {

  const campaignId = 'my-campaign-id';
  let event;

  describe('#respond()', () => {
    beforeEach(() => {
      sinon.stub(Campaign, 'delete').resolves(true);
      event = {campaignId};
    });

    it('deletes the campaign', (done) => {
      respond(event, (err, result) => {
        const args = Campaign.delete.lastCall.args;
        expect(args[1]).to.equal(campaignId);
        expect(err).to.not.exist;
        expect(result).to.deep.be.truthy;
        done();
      });
    });

    afterEach(() => {
      Campaign.delete.restore();
    });
  });
});
