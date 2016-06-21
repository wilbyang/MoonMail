'use strict';

import * as chai from 'chai';
import { respond } from './action';
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { List } from 'moonmail-models';

const expect = chai.expect;

describe('getEmailList', () => {

  const listId = 'my-list-id';
  const list = {
    userId: 'some-user-id',
    id: listId,
    name: 'my list'
  };
  let event;

  describe('#respond()', () => {
    beforeEach(() => {
      sinon.stub(List, 'get').resolves(list);
    });

    context('when the event is valid', () => {
      before(() => {
        event = {listId};
      });

      it('gets the list', (done) => {
        respond(event, (err, result) => {
          const args = List.get.lastCall.args;
          expect(args[1]).to.equal(listId);
          expect(err).to.not.exist;
          expect(result).to.deep.equal(list);
          done();
        });
      });
    });

    afterEach(() => {
      List.get.restore();
    });
  });
});
