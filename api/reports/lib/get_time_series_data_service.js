import moment from 'moment';
import * as momentRound from 'moment-round';

export default class GetTimeSeriesDataService {

  static async run(model, id, start, end) {
    const service = new GetTimeSeriesDataService(model, id, start, end);
    const report = await service.fetch();
    return report;
  }

  constructor(model, id, start, end, step = 15) {
    this.model = model;
    this.id = id;
    this.start = start;
    this.end = end || moment.unix(start).add(6, 'hours').unix().toString();
    this.step = step;
  }

  async fetch() {
    const report = await this.model.allBetween(this.id, this.start, this.end);
    const cleanReport = this._reportCleanup(report);
    const completeReport = this._fillGaps(cleanReport);
    return completeReport;
  }

  _fillGaps(report) {
    const emptyDates = this._getEmptyDates(report.items, this.start, this.end);
    const emptyValues = emptyDates.map(date => ({timestamp: date, count: 0}));
    return {items: [].concat(report.items, emptyValues)};
  }

  _reportCleanup(report) {
    return {items: report.items.map(item => ({timestamp: item.timestamp, count: item.count}))};
  }

  _getEmptyDates(items) {
    const timestamps = new Set(items.map(item => parseInt(item.timestamp)));
    const lowestQuarter = moment.unix(this.start).floor(this.step, 'minutes').unix();
    const dateRange = this._generateTimestamps(lowestQuarter);
    const emptyDates = new Set([...dateRange].filter(x => !timestamps.has(x)));
    return [...emptyDates];
  }

  _generateTimestamps(start) {
    if (start > this.end) return new Set();
    else {
      const nextStep = moment.unix(start).add(this.step, 'minutes').unix();
      return this._generateTimestamps(nextStep, this.end, this.step).add(start);
    }
  }
}
