'use strict';

import * as chai from 'chai';
import { respond } from './action';
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { Campaign } from 'moonmail-models';

const expect = chai.expect;

describe('createCampaign', () => {

  const senderId = 'ca654';
  const subject = 'my campaign subject';
  const listIds = ['ca43546'];
  const name = 'my campaign';
  const body = 'my campaign body';
  const campaign = {senderId, subject, listIds, name, body};
  let event;

  describe('#respond()', () => {
    beforeEach(() => {
      sinon.stub(Campaign, 'save').resolves('ok');
    });

    context('when the event is valid', () => {
      before(() => {
        event = {campaign};
      });

      it('creates the campaign', (done) => {
        respond(event, (err, result) => {
          const args = Campaign.save.firstCall.args[0];
          expect(args).to.have.property('userId');
          expect(args).to.have.property('id');
          expect(err).to.not.exist;
          expect(result).to.exist;
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
      Campaign.save.restore();
    });
  });
});
