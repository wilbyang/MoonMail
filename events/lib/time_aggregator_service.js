import R from 'ramda';
import moment from 'moment';

const _timeWindowToTimeUnit = {
  m: 'minute',
  minutes: 'minute',
  h: 'hour',
  hours: 'hour',
  d: 'date',
  days: 'date',
  w: 'week',
  weeks: 'week',
  M: 'month',
  months: 'month',
  y: 'year',
  years: 'year'
};

const tsReduceOperations = {
  COUNT: (groupedData, options) => {
    const timeColumn = options.timeColumn || 'time';
    const eventName = options.eventName || 'event';
    const groupByAttrs = options.groupByAttrs || [];
    const aggregatedData = [];
    Object.keys(groupedData).forEach((groupId) => {
      if (!groupByAttrs.length) {
        const record = {
          count: groupedData[groupId].length,
          eventName
        };
        record[timeColumn] = groupId;
        aggregatedData.push(record);
      } else {
        const groups = R.groupBy((row) => {
          return groupByAttrs.map(e => row[e]).join('____');
        })(groupedData[groupId]);

        groupedData[groupId] = groups;

        Object.keys(groups).forEach((subGroupId) => {
          const record = {
            count: groups[subGroupId].length,
            eventName
          };
          groupByAttrs.forEach((column) => {
            //
            // Since keepColumns should be used to retrieve
            // unique tuples across the same group we can take
            // as reference the first element in group groupedData[groupId][0]
            //
            record[column] = groups[subGroupId][0][column];
          });
          record[timeColumn] = groupId;
          aggregatedData.push(record);
        });
      }
    });
    return aggregatedData;
  }
};

class TimeAggregatorService {

  static aggregate(events, timeWindow, options) {
    return new TimeAggregatorService(events,
        timeWindow,
        options.groupByAttrs || [],
        options.eventName || 'event',
        options.deduplicationFunc,
        options.aggregateOperation || 'COUNT',
        options.timestampAttribute || 'timestamp')
      .aggregate();
  }

  constructor(events, timeWindow, groupByAttrs, eventName, deduplicationFunc, aggregateOperation, timestampAttribute) {
    this.events = events;
    // time windows is an array of 2 positions representing
    // a duration (moment.js) ex: [5, 'm']
    this.timeWindow = timeWindow;
    this.timeWindowObject = moment.duration(...timeWindow);
    this.groupByAttrs = groupByAttrs;
    this.deduplicationFunc = deduplicationFunc;
    this.aggregateOperation = aggregateOperation;
    this.timestampAttribute = timestampAttribute;
    this.eventName = eventName;
    this._validateTimeWindow();
  }

  aggregate() {
    // Group by aligning intervals
    const groupBy = R.groupBy(this._floorDate.bind(this));
    const groups = groupBy(this.events);
    if (this.deduplicationFunc) {
      const newGroups = {};
      Object.keys(groups).forEach((key) => {
        newGroups[key] = R.uniqBy(this.deduplicationFunc, groups[key]);
      });
      return this._reduce(newGroups);
    }
    return this._reduce(groups);
  }

  _reduce(groups) {
    return tsReduceOperations[this.aggregateOperation](groups, {
      groupByAttrs: this.groupByAttrs,
      timeColumn: this.timestampAttribute,
      eventName: this.eventName
    });
  }

  _floorDate(event) {
    const dateTime = moment.unix(event[this.timestampAttribute]);
    // returns a valid momentjs time unit m, minutes => minute
    const timeUnit = _timeWindowToTimeUnit[this.timeWindow[1]];
    // convert minutes, hours, days, etc to the beginning of grouping interval
    // ex: 12:01:00 in 5m interval returns 00,
    // and 12:07:00 in 5m interval returns 05
    // * make days (date) zero based because they
    // start on 1 and then perform the same operation as above.
    let currentInTimeUnit = dateTime[timeUnit]();
    if (['date'].find((e) => e === timeUnit)) {
      currentInTimeUnit -= 1; // make it zero based
    }
    const newTimeUnit = Math.floor(currentInTimeUnit / this.timeWindow[0]) * this.timeWindow[0];
    // creates a datetime at the begining of the grouping interval
    // ex: 12:01:10 in 5m interval returns 12:00:00
    // 12:07:50 in 5m interval returns 12:05:00
    const newDateTime = dateTime.set(timeUnit, newTimeUnit).startOf(timeUnit);
    return newDateTime.unix();
  }

  // @deprecated
  _startOf(date, unit) {
    if (unit === 'year') {
      return date.month(0).date(1).hours(0).minutes(0).seconds(0).milliseconds(0);
    } else if (unit === 'month') {
      return date.date(1).hours(0).minutes(0).seconds(0).milliseconds(0);
    } else if (unit === 'date') {
      return date.hours(0).minutes(0).seconds(0).milliseconds(0);
    } else if (unit === 'hour') {
      return date.minutes(0).seconds(0).milliseconds(0);
    } else if (unit === 'minute') {
      return date.seconds(0).milliseconds(0);
    }
  }

  _validateTimeWindow() {
    if (!['m', 'minutes',
      'h', 'hours',
      'd', 'days',
      'w', 'weeks',
      'M', 'months',
      'y', 'years'].find(e => e === this.timeWindow[1])) {
      throw new Error('Unsupported time window');
    }
  }

}

module.exports.TimeAggregatorService = TimeAggregatorService;
