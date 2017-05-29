import * as chai from 'chai';
import { respond } from './action';
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { RecipientsCounterService } from '../../lib/recipients_counter_service';
import * as event from './event.json';

const expect = chai.expect;

describe('recipientsCounter', () => {
  const recipientsCounterService = sinon.createStubInstance(RecipientsCounterService);

  describe('#respond()', () => {
    beforeEach(() => {
      sinon.stub(RecipientsCounterService, 'create').returns(recipientsCounterService);
      recipientsCounterService.updateCounters.resolves({});
    });

    it('calls to the update counters service', (done) => {
      respond(event, (err, result) => {
        expect(recipientsCounterService.updateCounters).calledOnce;
        done();
      });
    });

    afterEach(() => {
      recipientsCounterService.updateCounters.restore();
    });
  });
});
