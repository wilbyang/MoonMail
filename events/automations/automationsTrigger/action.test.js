import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import 'sinon-as-promised';
import respond from './action';
import * as event from './event.json';
import TriggerAutomationsService from '../lib/trigger_automations_service';

const expect = chai.expect;
chai.use(sinonChai);

describe('triggerAutomations.action', () => {
  before(() => {
    sinon.stub(TriggerAutomationsService, 'execute').resolves(true);
  });
  after(() => {
    TriggerAutomationsService.execute.restore();
  });

  it('should pass valid events to automations trigger', (done) => {
    respond(event, (err) => {
      expect(err).not.to.exist;
      expect(TriggerAutomationsService.execute).to.have.been.calledOnce;
      const triggerArgs = TriggerAutomationsService.execute.lastCall.args[0];
      expect(triggerArgs.length).to.equal(2);
      done();
    });
  });
});
