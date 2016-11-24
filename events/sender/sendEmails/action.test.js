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

    context('the sender has very poor reputation', () => {
      before(() => {
        state = { reputation: 15 };
        sinon.stub(Promise, 'delay').resolves({});
      });

      it('pauses the execution for 120 secs', (done) => {
        handlePauses(state).then(() => {
          expect(Promise.delay.lastCall.args).to.deep.equals([120000]); // 2m pause
          done();
        }).catch(error => done(error));
      });
      after(() => {
        Promise.delay.restore();
      });
    });

    context('the sender has very good reputation', () => {
      before(() => {
        state = { reputation: 92 };
        sinon.stub(Promise, 'delay').resolves({});
      });

      it('pauses the execution for a few seconds', (done) => {
        handlePauses(state).then(() => {
          expect(Promise.delay.lastCall.args).to.deep.equals([0]);
          done();
        }).catch(error => done(error));
      });
      after(() => {
        Promise.delay.restore();
      });
    });

    context('the sender has perfect reputation', () => {
      before(() => {
        state = { reputation: 100 };
        sinon.stub(Promise, 'delay').resolves({});
      });

      it('pauses the execution for a few seconds', (done) => {
        handlePauses(state).then(() => {
          expect(Promise.delay.lastCall.args).to.deep.equals([0]);
          done();
        }).catch(error => done(error));
      });
      after(() => {
        Promise.delay.restore();
      });
    });
  });
});
