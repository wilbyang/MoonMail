import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import sinonChai from 'sinon-chai';
import { Open } from 'moonmail-models';
import { SaveKinesisStreamService } from './save_kinesis_stream_service';

chai.use(chaiAsPromised);
chai.use(sinonChai);
const expect = chai.expect;
const generateKinesisRecord = (payload) => ({kinesis: {data: new Buffer(JSON.stringify(payload)).toString('base64')}});
const generateKinesisStream = (payloads) => ({Records: payloads.map(generateKinesisRecord)});
const model = Open;
const generateModelItem = () => {
  const item = {someAttribute: 123};
  item[model.hashKey] = Math.random().toString();
  item[model.rangeKey] = Math.random().toString();
  return item;
};
let kinesisStream;
let payloads;
let service;

describe('SaveKinesisStreamService', () => {
  describe('#save', () => {
    beforeEach(() => sinon.stub(model, 'saveAll').resolves(true));

    context('when records are valid', () => {
      before(() => {
        payloads = Array(5).fill().map(() => generateModelItem());
        kinesisStream = generateKinesisStream(payloads);
        service = new SaveKinesisStreamService(kinesisStream, model);
      });

      it('should save all the records', done => {
        service.save().then(() => {
          expect(model.saveAll).to.have.been.calledOnce;
          expect(model.saveAll).to.have.been.calledWith(payloads);
          done();
        }).catch(done);
      });
    });

    context('when some records are invalid', () => {
      before(() => {
        payloads = Array(5).fill().map(() => generateModelItem());
        kinesisStream = generateKinesisStream(payloads);
        kinesisStream.Records.push(generateKinesisRecord({some: 'weird item'}));
        service = new SaveKinesisStreamService(kinesisStream, model);
      });

      it('should filter them out', done => {
        service.save().then(() => {
          expect(model.saveAll).to.have.been.calledOnce;
          expect(model.saveAll).to.have.been.calledWith(payloads);
          done();
        }).catch(done);
      });
    });

    context('when some records are duplicated', () => {
      before(() => {
        payloads = Array(5).fill().map(() => generateModelItem());
        const payloadsWithDuplicates = payloads.slice(0).concat(payloads);
        kinesisStream = generateKinesisStream(payloadsWithDuplicates);
        service = new SaveKinesisStreamService(kinesisStream, model);
      });

      it('should filter them out', done => {
        service.save().then(() => {
          expect(model.saveAll).to.have.been.calledOnce;
          expect(model.saveAll).to.have.been.calledWith(payloads);
          done();
        }).catch(done);
      });
    });

    context('when the number of valid records is greater than 25', () => {
      before(() => {
        payloads = Array(35).fill().map(() => generateModelItem());
        kinesisStream = generateKinesisStream(payloads);
        service = new SaveKinesisStreamService(kinesisStream, model);
      });

      it('should save them in batches of 25', done => {
        service.save().then(() => {
          expect(model.saveAll).to.have.been.calledTwice;
          const firstCallItems = model.saveAll.args[0][0];
          const secondCallItems = model.saveAll.args[1][0];
          const allItems = firstCallItems.concat(secondCallItems);
          expect(allItems).to.deep.equal(payloads);
          done();
        }).catch(done);
      });
    });

    afterEach(() => model.saveAll.restore());
  });
});
