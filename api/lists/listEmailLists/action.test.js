'use strict';

import * as chai from 'chai';
import { respond } from './action';
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { List } from 'moonmail-models';

const expect = chai.expect;

describe('listEmailLists', () => {
  let event;

  describe('#respond()', () => {
    beforeEach(() => {
      sinon.stub(List, 'allBy').resolves({
        Items: [
          {
            userId: 'some-user-id',
            id: 'cio2p2vqt0000n0edndspzrqy',
            name: 'my List'
          }
        ]
      });
    });

    before(() => {
      event = {};
    });

    it('gets a list of Email Lists', (done) => {
      respond(event, (err, result) => {
        const args = List.allBy.lastCall.args;
        expect(args[0]).to.equal('userId');
        expect(err).to.not.exist;
        expect(result).to.exist;
        done();
      });
    });

    context('when the event contains nextPage', () => {
      it('makes a paginated query', (done) => {
        const page = 'aaabbbb';
        event.options = {page};
        respond(event, (err) => {
          const allbyArgs = List.allBy.lastCall.args;
          expect(allbyArgs[2]).to.have.property('page', page);
          done();
        });
      });
    });

    afterEach(() => {
      List.allBy.restore();
    });
  });
});
