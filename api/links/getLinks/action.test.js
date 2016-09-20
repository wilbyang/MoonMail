'use strict';

import * as chai from 'chai';
import { respond } from './action';
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { Link } from 'moonmail-models';

const expect = chai.expect;

describe('getLinks', () => {

  const campaignId = 'my-campaign-id';
  let event;
  const links = {
    id: campaignId,
    links: {
      'link-id': {
        text: 'the text',
        url: 'linkurl.com'
      }
    }
  };

  describe('#respond()', () => {
    beforeEach(() => {
      sinon.stub(Link, 'get').resolves(links);
    });

    context('when the event is valid', () => {
      before(() => {
        event = {campaignId};
      });

      it('gets the links', (done) => {
        respond(event, (err, result) => {
          const args = Link.get.lastCall.args;
          expect(args[0]).to.equal(campaignId);
          expect(err).to.not.exist;
          expect(result).to.deep.equal(links);
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
      Link.get.restore();
    });
  });
});
