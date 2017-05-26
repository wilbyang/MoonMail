import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import 'sinon-as-promised';
import respond from './action';
import Events from '../../lib/events';
import EventsLog from '../../lib/events_log';

const expect = chai.expect;
chai.use(sinonChai);

describe('writeEvents.action', () => {
  const payload = {some: 'event'};
  const event = {Records: [{Sns: {Message: JSON.stringify(payload)}}]};

  context('when the event is valid', () => {
    before(() => {
      sinon.stub(Events, 'isValid').returns(true);
      sinon.stub(EventsLog, 'write').resolves({});
    });
    after(() => {
      Events.isValid.restore();
      EventsLog.write.restore();
    });

    it('should write it to the log', (done) => {
      respond(event, (err) => {
        expect(err).not.to.exist;
        expect(EventsLog.write).to.have.been.calledWithExactly({payload});
        done();
      });
    });
  });

  context('when the event is not valid', () => {
    before(() => {
      sinon.stub(Events, 'isValid').returns(false);
      sinon.spy(EventsLog, 'write');
    });
    after(() => {
      Events.isValid.restore();
      EventsLog.write.restore();
    });

    it('should exit without side effects', (done) => {
      respond(event, (err) => {
        expect(err).not.to.exist;
        expect(EventsLog.write).not.to.have.been.called;
        done();
      });
    });
  });
});
