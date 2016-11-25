import chai from 'chai';
import { respond } from './action';
import sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import sinonChai from 'sinon-chai';
import { OpenReport } from 'moonmail-models';
import GetTimeSeriesDataService from '../lib/get_time_series_data_service';

const expect = chai.expect;
chai.use(sinonChai);

describe('getAggregatedOpens', () => {
  const campaignId = 'my-campaign-id';
  const start = 1234;
  const end = 4556;
  let event;

  describe('#respond()', () => {
    beforeEach(() => {
      sinon.stub(GetTimeSeriesDataService, 'run').resolves(true);
    });

    context('when the event is valid', () => {
      before(() => {
        event = {campaignId, start, end};
      });

      it('gets the opens report', (done) => {
        respond(event, (err, result) => {
          expect(GetTimeSeriesDataService.run).to.have.been.calledWithExactly(OpenReport, campaignId, start, end);
          done();
        });
      });
    });

    context('when the event is not valid', () => {
      event = {};
      it('returns an error message', (done) => {
        respond(event, (err, result) => {
          expect(result).to.not.exist;
          expect(err).to.exist;
          done();
        });
      });
    });

    afterEach(() => {
      GetTimeSeriesDataService.run.restore();
    });
  });
});
