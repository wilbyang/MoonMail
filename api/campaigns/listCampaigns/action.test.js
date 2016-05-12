'use strict';

import * as chai from 'chai';
import { respond } from './action';
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { Campaign } from 'moonmail-models';

const expect = chai.expect;

describe('listCampaigns', () => {

  const userId = 'ca7654';
  let event;

  describe('#respond()', () => {
    beforeEach(() => {
      sinon.stub(Campaign, 'allBy').resolves({
        "Items": [
          {
            "senderId": "ca654",
            "id": "cio2p2vqt0000n0edndspzrqy",
            "subject": "my campaign subject",
            "userId": userId,
            "listIds": ["ca43546"],
            "name": "my campaign",
            "body": "my campaign body"
          }
        ],
        "Count": 1,
        "ScannedCount": 1
      });
    });

    context('when the event is valid', () => {
      before(() => {
        event = {userId};
      });

      it('creates the campaign', (done) => {
        respond(event, (err, result) => {
          const args = Campaign.allBy.firstCall.args;
          expect(args[0]).to.equal('userId');
          expect(args[1]).to.equal(userId);
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
      Campaign.allBy.restore();
    });
  });
});
