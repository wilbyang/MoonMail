'use strict';

import * as chai from 'chai';
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
import * as sinon from 'sinon';
import { StreamAggregatorService } from './stream_aggregator_service';
import * as sinonAsPromised from 'sinon-as-promised';
import moment from 'moment';

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('StreamAggregatorService', () => {
  describe('#aggregate()', () => {
    it('groups by minutes intervals', (done) => {
      const events = [
        { value: 1, timestamp: moment().startOf('day').valueOf() },
        { value: 2, timestamp: moment().startOf('day').add(10, 'seconds').valueOf() },
        { value: 3, timestamp: moment().startOf('day').add(6, 'minutes').valueOf() },
        { value: 4, timestamp: moment().startOf('day').add(7, 'minutes').valueOf() },
        { value: 5, timestamp: moment().startOf('day').add(11, 'minutes').valueOf() },
        { value: 5, timestamp: moment().startOf('day').add(12, 'minutes').valueOf() }
      ];
      const expectedGroups = 3;
      const result = StreamAggregatorService.aggregate(events, [5, 'm'], { eventName: 'valCount' });
      expect(Object.keys(result).length).to.equal(expectedGroups);
      done();
    });

    it('groups by hours intervals', (done) => {
      const events = [
        { value: 1, timestamp: moment().startOf('day').valueOf() },
        { value: 2, timestamp: moment().startOf('day').add(10, 'minute').valueOf() },
        { value: 3, timestamp: moment().startOf('day').add(6, 'hours').valueOf() },
        { value: 4, timestamp: moment().startOf('day').add(7, 'hours').valueOf() },
        { value: 5, timestamp: moment().startOf('day').add(11, 'hours').valueOf() },
        { value: 5, timestamp: moment().startOf('day').add(12, 'hours').valueOf() }
      ];
      const expectedGroups = 3;
      const result = StreamAggregatorService.aggregate(events, [5, 'h'], { eventName: 'valCount' });
      expect(Object.keys(result).length).to.equal(expectedGroups);
      done();
    });

    it('groups by days intervals', (done) => {
      const events = [
        { value: 1, timestamp: moment().startOf('month').valueOf() },
        { value: 2, timestamp: moment().startOf('month').add(10, 'hours').valueOf() },
        { value: 3, timestamp: moment().startOf('month').add(6, 'days').valueOf() },
        { value: 4, timestamp: moment().startOf('month').add(7, 'days').valueOf() },
        { value: 5, timestamp: moment().startOf('month').add(11, 'days').valueOf() },
        { value: 5, timestamp: moment().startOf('month').add(12, 'days').valueOf() }
      ];
      const expectedGroups = 3;
      const result = StreamAggregatorService.aggregate(events, [5, 'd'], { eventName: 'valCount' });
      expect(Object.keys(result).length).to.equal(expectedGroups);
      done();
    });

    it('groups by month intervals', (done) => {
      const events = [
        { value: 1, timestamp: moment().startOf('year').valueOf() },
        { value: 2, timestamp: moment().startOf('year').add(10, 'days').valueOf() },
        { value: 3, timestamp: moment().startOf('year').add(5, 'month').valueOf() },
        { value: 4, timestamp: moment().startOf('year').add(5, 'month').valueOf() },
        { value: 5, timestamp: moment().startOf('year').add(6, 'month').valueOf() },
        { value: 5, timestamp: moment().startOf('year').add(10, 'month').valueOf() }
      ];
      const expectedGroups = 2;
      const result = StreamAggregatorService.aggregate(events, [6, 'M'], { eventName: 'valCount' });
      expect(Object.keys(result).length).to.equal(expectedGroups);
      done();
    });

    it('groups by year intervals', (done) => {
      const events = [
        { value: 1, timestamp: moment().startOf('year').valueOf() },
        { value: 2, timestamp: moment().startOf('year').add(10, 'month').valueOf() },
        { value: 3, timestamp: moment().startOf('year').add(1, 'year').valueOf() },
        { value: 4, timestamp: moment().startOf('year').add(3, 'year').valueOf() },
        { value: 5, timestamp: moment().startOf('year').add(6, 'year').valueOf() },
        { value: 5, timestamp: moment().startOf('year').add(10, 'year').valueOf() }
      ];
      const expectedGroups = 4;
      const result = StreamAggregatorService.aggregate(events, [2, 'y'], { eventName: 'valCount' });
      expect(Object.keys(result).length).to.equal(expectedGroups);
      done();
    });

    it('groups by intervals and deduplicates', (done) => {
      const events = [
        { id: 1, id2: 1, timestamp: moment().startOf('day').valueOf() },
        { id: 1, id2: 1, timestamp: moment().startOf('day').add(10, 'seconds').valueOf() },
        { id: 2, id2: 2, timestamp: moment().startOf('day').add(6, 'minutes').valueOf() },
        { id: 2, id2: 3, timestamp: moment().startOf('day').add(7, 'minutes').valueOf() },
        { id: 3, id2: 4, timestamp: moment().startOf('day').add(11, 'minutes').valueOf() },
        { id: 4, id2: 4, timestamp: moment().startOf('day').add(12, 'minutes').valueOf() }
      ];
      const expectedGroups = 3;
      const result = StreamAggregatorService.aggregate(events, [5, 'm'], {
        eventName: 'valCount',
        deduplicationFunc: (event) => `${event.id}-${event.id2}`
      });
      expect(Object.keys(result).length).to.equal(expectedGroups);
      expect(result[0].count).to.equal(1);
      expect(result[1].count).to.equal(2);
      expect(result[2].count).to.equal(2);
      done();
    });
  });
});
