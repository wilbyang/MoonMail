import * as chai from 'chai';
const expect = chai.expect;
import chaiAsPromised from 'chai-as-promised';
import chaiThings from 'chai-things';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import awsMock from 'aws-sdk-mock';
import AWS from 'aws-sdk';
import fs from 'fs';
import { ImportRecipientsService } from './import_recipients_service';
chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.use(chaiThings);

describe('ImportRecipientsService', () => {
  const lambdaContext = {
    functionName: 'lambda-function-name',
    getRemainingTimeInMillis: () => {}
  };
  let contextStub;
  let lambdaClient;
  let s3Client;

  before(() => {
    awsMock.mock('S3', 'getObject', {
      data: {
        Body: fs.readFile(require('path').resolve(
                __dirname,
                'fixtures/recipients_import.csv'))
      }
    });
    contextStub = sinon.stub(lambdaContext, 'getRemainingTimeInMillis').returns(100000);
    awsMock.mock('Lambda', 'invoke', 'ok');
    lambdaClient = new AWS.Lambda();
    s3Client = new AWS.S3();
  });

  describe('#importAll', () => {
    context('when a csv file uploaded', () => {
      const serviceParams = {
        s3Event: {
          bucket: {
            name: 'Random S3 import bucket'
          },
          object: {
            key: 'listId#1.amarker.csv'
          }
        }
      };
      it('imports recipients', (done) => {
        const importRecipientsService = new ImportRecipientsService(serviceParams, lambdaClient, contextStub);
        expect(importRecipientsService).to.have.property('listId', 'listId#1');
        expect(importRecipientsService).to.have.property('fileExt', 'csv');
        expect(importRecipientsService).to.have.property('importOffset', 0);
        expect(importRecipientsService).to.have.deep.property('s3Event', serviceParams.s3Event);
        done();
      });
    });
  });

  after(() => {
    awsMock.restore('S3');
    awsMock.restore('Lambda');
    contextStub.restore();
  });
});
