'use strict';

import * as chai from 'chai';
import { respond } from './action';
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { List } from 'moonmail-models';

const expect = chai.expect;

describe('deleteEmailList', () => {

  const listId = 'my-list-id';
  let event;

  describe('#respond()', () => {
    beforeEach(() => {
      sinon.stub(List, 'delete').resolves(true);
      event = {listId};
    });

    it('deletes the list', (done) => {
      respond(event, (err, result) => {
        const args = List.delete.lastCall.args;
        expect(args[1]).to.equal(listId);
        expect(err).to.not.exist;
        expect(result).to.deep.be.truthy;
        done();
      });
    });

    afterEach(() => {
      List.delete.restore();
    });
  });
});
