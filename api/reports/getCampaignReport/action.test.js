'use strict';

import * as chai from 'chai';
import { respond } from './action';
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { Report } from 'moonmail-models';

const expect = chai.expect;

describe('getCampaign', () => {

  const campaignId = 'my-campaign-id';
  const campaignReport = {
    campaignId,
    clicksCount: 10,
    opensCount: 20,
    bouncesCount: 2,
    complaintsCount: 1
  };
  let event;

  describe('#respond()', () => {
    beforeEach(() => {
      sinon.stub(Report, 'get').resolves(campaignReport);
    });

    context('when the event is valid', () => {
      before(() => {
        event = {campaignId};
      });

      it('gets the campaign', (done) => {
        respond(event, (err, result) => {
          const args = Report.get.lastCall.args;
          expect(args[0]).to.equal(campaignId);
          expect(err).to.not.exist;
          expect(result).to.deep.equal(campaignReport);
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
      Report.get.restore();
    });
  });
});
