'use strict';

import { Promise } from 'bluebird';
import * as chai from 'chai';
import { respond, handlePauses } from './action';
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';

const expect = chai.expect;

describe('sendEmails', () => {

  let state;
  describe('#handlePauses()', () => {

    context('it is been too long since the last pause', () => {
      before(() => {
        state = { sentEmails: 1001, lastPausedOn: 0};
        sinon.stub(Promise, 'delay').resolves({});
      });

      it('pauses the execution for a while', (done) => {
        handlePauses(state).then((lastPausedOn) => {
          expect(Promise.delay.lastCall.args).to.deep.equals([120000, 1001]); // 2m pause, update lastPausedOn
          done();
        }).catch(error => done(error));
      });
      after(() => {
        Promise.delay.restore();
      });
    });

    context('not need to make a pause', () => {
      before(() => {
        state = { sentEmails: 1001, lastPausedOn: 10};
        sinon.stub(Promise, 'delay').resolves({});
      });

      it('pauses the execution for a while', (done) => {
        handlePauses(state).then((lastPausedOn) => {
          expect(Promise.delay.lastCall.args).to.deep.equals([0, 10]); // No pause, keep previous lastPausedOn
          done();
        }).catch(error => done(error));
      });
      after(() => {
        Promise.delay.restore();
      });
    });
  });
});
