import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import awsMock from 'aws-sdk-mock';
import AWS from 'aws-sdk';
import EventsLog from './events_log';

const expect = chai.expect;
chai.use(sinonChai);

describe('EventsLog', () => {
  describe('.write', () => {
    let kinesisStub;
    let clientGetterStub;

    before(() => {
      awsMock.mock('Kinesis', 'putRecord', {});
      kinesisStub = new AWS.Kinesis();
      clientGetterStub = sinon.stub(EventsLog, 'client', {get: () => kinesisStub});
      process.env.EVENTS_LOG_STREAM_NAME = 'kinesis-stream-name';
    });
    after(() => {
      awsMock.restore('Kinesis');
      clientGetterStub.restore();
      delete process.env.EVENTS_LOG_STREAM_NAME;
    });

    it('should write the event to the Kinesis Stream', async () => {
      const payload = {my: 'payload'};
      await EventsLog.write({payload});
      const expected = {
        Data: JSON.stringify(payload),
        PartitionKey: '1',
        StreamName: process.env.EVENTS_LOG_STREAM_NAME
      };
      expect(kinesisStub.putRecord).to.have.been.calledWith(expected);
    });
  });
});
