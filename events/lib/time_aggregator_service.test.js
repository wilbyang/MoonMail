'use strict';

import * as chai from 'chai';
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
import * as sinon from 'sinon';
import { TimeAggregatorService } from './time_aggregator_service';
import * as sinonAsPromised from 'sinon-as-promised';
import moment from 'moment';

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('TimeAggregatorService', () => {
  describe('#aggregate()', () => {
    it('groups by minutes intervals', (done) => {
      const events = [
        { id: 1, value: 1, timestamp: moment().startOf('day').unix() },
        { id: 2, value: 2, timestamp: moment().startOf('day').add(10, 'seconds').unix() },
        { id: 3, value: 3, timestamp: moment().startOf('day').add(6, 'minutes').unix() },
        { id: 4, value: 4, timestamp: moment().startOf('day').add(7, 'minutes').unix() },
        { id: 5, value: 5, timestamp: moment().startOf('day').add(11, 'minutes').unix() },
        { id: 6, value: 5, timestamp: moment().startOf('day').add(12, 'minutes').unix() }
      ];
      const expectedGroups = 3;
      const result = TimeAggregatorService.aggregate(events, [5, 'm'], { eventName: 'valCount' });
      expect(Object.keys(result).length).to.equal(expectedGroups);
      done();
    });

    it('groups by hours intervals', (done) => {
      const events = [
        { id: 1, value: 1, timestamp: moment().startOf('day').unix() },
        { id: 2, value: 2, timestamp: moment().startOf('day').add(10, 'minute').unix() },
        { id: 3, value: 3, timestamp: moment().startOf('day').add(6, 'hours').unix() },
        { id: 4, value: 4, timestamp: moment().startOf('day').add(7, 'hours').unix() },
        { id: 5, value: 5, timestamp: moment().startOf('day').add(11, 'hours').unix() },
        { id: 6, value: 5, timestamp: moment().startOf('day').add(12, 'hours').unix() }
      ];
      const expectedGroups = 3;
      const result = TimeAggregatorService.aggregate(events, [5, 'h'], { eventName: 'valCount' });
      expect(Object.keys(result).length).to.equal(expectedGroups);
      done();
    });

    it('groups by days intervals', (done) => {
      const events = [
        { id: 1, value: 1, timestamp: moment().startOf('month').unix() },
        { id: 2, value: 2, timestamp: moment().startOf('month').add(10, 'hours').unix() },
        { id: 3, value: 3, timestamp: moment().startOf('month').add(6, 'days').unix() },
        { id: 4, value: 4, timestamp: moment().startOf('month').add(7, 'days').unix() },
        { id: 5, value: 5, timestamp: moment().startOf('month').add(11, 'days').unix() },
        { id: 6, value: 5, timestamp: moment().startOf('month').add(12, 'days').unix() }
      ];
      const expectedGroups = 3;
      const result = TimeAggregatorService.aggregate(events, [5, 'd'], { eventName: 'valCount' });
      expect(Object.keys(result).length).to.equal(expectedGroups);
      done();
    });

    it('groups by month intervals', (done) => {
      const events = [
        { id: 1, value: 1, timestamp: moment().startOf('year').unix() },
        { id: 2, value: 2, timestamp: moment().startOf('year').add(10, 'days').unix() },
        { id: 3, value: 3, timestamp: moment().startOf('year').add(5, 'month').unix() },
        { id: 4, value: 4, timestamp: moment().startOf('year').add(5, 'month').unix() },
        { id: 5, value: 5, timestamp: moment().startOf('year').add(6, 'month').unix() },
        { id: 6, value: 5, timestamp: moment().startOf('year').add(10, 'month').unix() }
      ];
      const expectedGroups = 2;
      const result = TimeAggregatorService.aggregate(events, [6, 'M'], { eventName: 'valCount' });
      expect(Object.keys(result).length).to.equal(expectedGroups);
      done();
    });

    it('groups by year intervals', (done) => {
      const events = [
        { id: 1, value: 1, timestamp: moment().startOf('year').unix() },
        { id: 2, value: 2, timestamp: moment().startOf('year').unix() },
        { id: 3, value: 3, timestamp: moment().startOf('year').add(1, 'year').unix() },
        { id: 4, value: 4, timestamp: moment().startOf('year').add(3, 'year').unix() },
        { id: 5, value: 5, timestamp: moment().startOf('year').add(6, 'year').unix() },
        { id: 6, value: 5, timestamp: moment().startOf('year').add(10, 'year').unix() }
      ];
      const expectedGroups = 4;
      const result = TimeAggregatorService.aggregate(events, [2, 'y'], { eventName: 'valCount' });
      expect(Object.keys(result).length).to.equal(expectedGroups);
      done();
    });

    it('groups by intervals and deduplicates', (done) => {
      const events = [
        { id: 1, id2: 1, timestamp: moment().startOf('day').unix() },
        { id: 1, id2: 1, timestamp: moment().startOf('day').add(10, 'seconds').unix() },
        { id: 2, id2: 2, timestamp: moment().startOf('day').add(6, 'minutes').unix() },
        { id: 2, id2: 3, timestamp: moment().startOf('day').add(7, 'minutes').unix() },
        { id: 3, id2: 4, timestamp: moment().startOf('day').add(11, 'minutes').unix() },
        { id: 4, id2: 4, timestamp: moment().startOf('day').add(12, 'minutes').unix() }
      ];
      const expectedGroups = 3;
      const result = TimeAggregatorService.aggregate(events, [5, 'm'], {
        eventName: 'valCount',
        deduplicationFunc: (event) => `${event.id}-${event.id2}`
      });
      expect(Object.keys(result).length).to.equal(expectedGroups);
      expect(result[0].count).to.equal(1);
      expect(result[1].count).to.equal(2);
      expect(result[2].count).to.equal(2);
      done();
    });

    it('groups by intervals and groups by attributes', (done) => {
      const events = [
        { id: 1, id2: 1, timestamp: moment().startOf('day').unix() },
        { id: 1, id2: 1, timestamp: moment().startOf('day').add(10, 'seconds').unix() },
        { id: 2, id2: 2, timestamp: moment().startOf('day').add(6, 'minutes').unix() },
        { id: 2, id2: 3, timestamp: moment().startOf('day').add(7, 'minutes').unix() },
        { id: 3, id2: 4, timestamp: moment().startOf('day').add(11, 'minutes').unix() },
        { id: 4, id2: 4, timestamp: moment().startOf('day').add(12, 'minutes').unix() }
      ];
      const expectedGroups = 5;
      // const expectedResult = [
      //   { count: 2,
      //     eventName: 'valCount',
      //     id: 1,
      //     id2: 1,
      //     timestamp: '1477260000000' },
      //   { count: 1,
      //     eventName: 'valCount',
      //     id: 2,
      //     id2: 2,
      //     timestamp: '1477260300000' },
      //   { count: 1,
      //     eventName: 'valCount',
      //     id: 2,
      //     id2: 3,
      //     timestamp: '1477260300000' },
      //   { count: 1,
      //     eventName: 'valCount',
      //     id: 3,
      //     id2: 4,
      //     timestamp: '1477260600000' },
      //   { count: 1,
      //     eventName: 'valCount',
      //     id: 4,
      //     id2: 4,
      //     timestamp: '1477260600000' }
      // ];

      const result = TimeAggregatorService.aggregate(events, [5, 'm'], {
        groupByAttrs: ['id', 'id2'],
        eventName: 'valCount'
      });
      // expect(result).to.deep.equal(expectedResult);
      expect(Object.keys(result).length).to.equal(expectedGroups);
      expect(result[0].count).to.equal(2);
      expect(result[1].count).to.equal(1);
      expect(result[2].count).to.equal(1);
      expect(result[3].count).to.equal(1);
      expect(result[4].count).to.equal(1);
      done();
    });
  });
});
