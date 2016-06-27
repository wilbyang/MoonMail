'use strict';

import * as chai from 'chai';
const sinonChai = require('sinon-chai');
import { expect } from 'chai';
import * as sinon from 'sinon';
import { IncrementerService } from './incrementer_service';
import * as sinonAsPromised from 'sinon-as-promised';

chai.use(sinonChai);

describe('IncrementerService', () => {
  let incrementerService;
  let countByItemStub;
  let model;
  const attribute = 'someCount';
  const countByItem = [
    [['key1', 'range1'], 1],
    [['key2', 'range2'], 2],
    [['key3', 'range3'], 3]
  ];

  before(() => {
    model = sinon.stub({increment: () => {}});
    model.increment.resolves(true);
    incrementerService = new IncrementerService(model, attribute, null);
  });

  describe('#incrementCount()', () => {
    it('should save the clicks count', done => {
      const count = 3;
      const hashKey = 'my-hash';
      const rangeKey = 'my-range';
      incrementerService.incrementCount(count, hashKey, rangeKey);
      expect(model.increment.callCount).to.equal(1);
      expect(model.increment).to.have.been.calledWithExactly(attribute, count, hashKey, rangeKey);
      done();
    });
  });

  describe('#incrementAll()', () => {
    before(() => {
      sinon.stub(incrementerService, 'incrementCount').resolves(true);
      countByItemStub = sinon.stub(incrementerService, 'countByItem', { get: () => countByItem });
    });

    it('should save the clicks count', done => {
      incrementerService.incrementAll().then(() => {
        expect(incrementerService.incrementCount.callCount).to.equal(countByItem.length);
        countByItem.forEach(item => {
          const itemKeys = item[0];
          const itemCount = item[1];
          expect(incrementerService.incrementCount).to.have.been.calledWithExactly(itemCount, itemKeys[0], itemKeys[1]);
        });
        done();
      });
    });

    after(() => {
      incrementerService.incrementCount.restore();
    });
  });

  after(() => {
    model.increment.restore();
  });
});
