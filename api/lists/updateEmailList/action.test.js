'use strict';

import * as chai from 'chai';
import { respond } from './action';
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { List } from 'moonmail-models';

const expect = chai.expect;

describe('updateEmailList', () => {
  const listId = 'my-list-id';
  const list = {
    name: 'my list'
  }
  let event;

  describe('#respond()', () => {
    beforeEach(() => {
      sinon.stub(List, 'update').resolves(list);
    });

    context('when the event is valid', () => {
      before(() => {
        event = { list, listId };
      });

      it('updates the list', (done) => {
        respond(event, (err, result) => {
          const args = List.update.lastCall.args;
          expect(args[0]).to.equal(list);
          expect(args[2]).to.equal(listId);
          expect(err).to.not.exist;
          expect(result).to.deep.equal(list);
          done();
        });
      });
    });

    context('when the event is not valid', () => {
      before(() => {
        event = {};
      });

      it('returns an error message', (done) => {
        respond(event, (err, result) => {
          expect(result).to.not.exist;
          expect(err).to.exist;
          expect(List.update).not.to.be.called;
          done();
        });
      });
    });

    afterEach(() => {
      List.update.restore();
    });
  });
});
