import { OpenReport } from 'moonmail-models';
import * as chai from 'chai';
import respond from './action';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import * as sinonAsPromised from 'sinon-as-promised';
import * as event from './event.json';
import { IncrementAggregatedEventsService } from '../../lib/increment_aggregated_events_service';

chai.use(sinonChai);
const expect = chai.expect;

describe('aggregateOpens', () => {
  describe('#respond()', () => {
    const serviceStub = {incrementAll: () => true};

    beforeEach(() => {
      sinon.stub(serviceStub, 'incrementAll').resolves(true);
      sinon.stub(IncrementAggregatedEventsService, 'create').returns(serviceStub);
    });

    it('saves all the opens', (done) => {
      respond(event, (err, result) => {
        expect(IncrementAggregatedEventsService.create).to.have.been.calledWithExactly(event.Records, OpenReport);
        expect(serviceStub.incrementAll).to.have.been.calledOnce;
        done();
      });
    });

    afterEach(() => {
      IncrementAggregatedEventsService.create.restore();
      serviceStub.incrementAll.restore();
    });
  });
});
