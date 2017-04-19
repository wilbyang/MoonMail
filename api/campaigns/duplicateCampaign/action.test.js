'use strict';

import * as chai from 'chai';
import { respond } from './action';
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { Campaign } from 'moonmail-models';

const expect = chai.expect;

describe('duplicateCampaign', () => {

  const senderId = 'ca654';
  const subject = 'my campaign subject';
  const listIds = ['ca43546'];
  const name = 'my campaign';
  const body = 'my campaign body';
  const campaignId = 'campaign-id';

  const campaign = { id: campaignId, senderId, subject, listIds, name, body };
  let event;

  describe('#respond()', () => {
    beforeEach(() => {
      sinon.stub(Campaign, 'save').resolves('ok');
    });

    context('when the event is valid', () => {
      before(() => {
        event = { campaignId };
        sinon.stub(Campaign, 'get').resolves(Object.assign({userId: 'user-id', id: campaignId}, campaign));
      });

      it('duplicates the campaign', (done) => {
        respond(event, (err, result) => {
          expect(Campaign.get).to.have.been.called;
          expect(Campaign.get.lastCall.args).to.deep.equals(['my-user-id', 'campaign-id']);
          const args = Campaign.save.lastCall.args[0];
          expect(args).to.have.property('userId');
          expect(args).to.have.property('id');
          expect(args).to.have.property('status');
          expect(args).to.have.property('subject', campaign.subject);
          expect(args).to.have.property('body', campaign.body);
          expect(args).to.have.property('name', `${name} copy`);
          expect(err).to.not.exist;
          expect(result).to.exist;
          done();
        });
      });

      after(() => {
        Campaign.get.restore();
      });
    });

    context('when the event is not valid', () => {
      it('returns an error message', (done) => {
        respond({}, (err, result) => {
          expect(result).to.not.exist;
          expect(err).to.exist;
          done();
        });
      });
    });

    context('when the campaign does not exists', () => {
      before(() => {
        event = { campaignId: 'non-existing' };
        sinon.stub(Campaign, 'get').rejects('campaign not found');
      });

      it('returns an error message', (done) => {
        respond(event, (err, result) => {
          expect(Campaign.save).to.have.been.not.called;
          expect(result).to.not.exist;
          expect(err).to.exist;
          done();
        });
      });

      after(() => {
        Campaign.get.restore();
      });
    });

    afterEach(() => {
      Campaign.save.restore();
    });
  });
});
