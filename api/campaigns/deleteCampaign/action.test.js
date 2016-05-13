'use strict';

import * as chai from 'chai';
import { respond } from './action';
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { Campaign } from 'moonmail-models';

const expect = chai.expect;

describe('deleteCampaign', () => {

  const userId = 'ca7654';
  const campaignId = 'my-campaign-id';
  let event;

  describe('#respond()', () => {
    beforeEach(() => {
      sinon.stub(Campaign, 'delete').resolves(true);
    });

    context('when the event is valid', () => {
      before(() => {
        event = {userId, campaignId};
      });

      it('deletes the campaign', (done) => {
        respond(event, (err, result) => {
          const args = Campaign.delete.lastCall.args;
          expect(args[0]).to.equal(userId);
          expect(args[1]).to.equal(campaignId);
          expect(err).to.not.exist;
          expect(result).to.deep.be.truthy;
          done();
        });
      });
    });

    context('when the event is not valid', () => {
      event = {};
      it('returns an error message', (done) => {
        respond(event, (err, result) => {
          expect(result).to.not.exist;
          expect(err).to.exist;
          done();
        });
      });
    });

    afterEach(() => {
      Campaign.delete.restore();
    });
  });
});
