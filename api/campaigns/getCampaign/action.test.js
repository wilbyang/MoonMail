'use strict';

import * as chai from 'chai';
import { respond } from './action';
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { Campaign } from 'moonmail-models';

const expect = chai.expect;

describe('getCampaign', () => {

  const campaignId = 'my-campaign-id';
  const campaign = {
    senderId: 'ca654',
    id: campaignId,
    subject: 'my campaign subject',
    listIds: ['ca43546'],
    name: 'my campaign',
    body: 'my campaign body'
  };
  let event;

  describe('#respond()', () => {
    beforeEach(() => {
      sinon.stub(Campaign, 'get').resolves(campaign);
    });

    context('when the event is valid', () => {
      before(() => {
        event = {campaignId};
      });

      it('gets the campaign', (done) => {
        respond(event, (err, result) => {
          const args = Campaign.get.lastCall.args;
          expect(args[1]).to.equal(campaignId);
          expect(err).to.not.exist;
          expect(result).to.deep.equal(campaign);
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
      Campaign.get.restore();
    });
  });
});
