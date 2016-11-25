import chai from 'chai';
import sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import sinonChai from 'sinon-chai';
import moment from 'moment';
import * as momentRound from 'moment-round';
import GetTimeSeriesDataService from './get_time_series_data_service';

const expect = chai.expect;
chai.use(sinonChai);

describe('GetTimeSeriesDataService', () => {
  describe('.run()', () => {
    const start = moment().floor(15, 'minutes').unix();
    const end = moment.unix(start).add(45, 'minutes').unix();
    const emptyIntervals = [
      moment.unix(start).add(15, 'minutes').unix(),
      moment.unix(start).add(30, 'minutes').unix()
    ];
    const campaignId = 'campaign-id';
    const reportResponse = {
      items: [
        {timestamp: start, count: 2, campaignId},
        {timestamp: end, count: 1, campaignId}
      ]
    };
    const Model = {allBetween: () => null};

    before(() => {
      sinon.stub(Model, 'allBetween').resolves(reportResponse);
    });

    it('should return time series data in 15 minutes steps', async (done) => {
      const report = await GetTimeSeriesDataService.run(Model, campaignId, start, end);
      const items = report.items;
      expect(items).to.have.lengthOf(4);
      expect(items).to.include({timestamp: start, count: 2});
      expect(items).to.include({timestamp: end, count: 1});
      emptyIntervals.forEach(timestamp => expect(items).to.include({timestamp, count: 0}));
      expect(Model.allBetween).to.have.been.calledWithExactly(campaignId, start, end);
      done();
    });

    after(() => {
      Model.allBetween.restore();
    });
  });
});
