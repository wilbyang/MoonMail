import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chaiThings from 'chai-things';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import awsMock from 'aws-sdk-mock';
import AWS from 'aws-sdk';
import { ImportRecipientsService } from './import_recipients_service';
import { Recipient, List } from 'moonmail-models';
import 'sinon-as-promised';
const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.use(chaiThings);

describe('ImportRecipientsService', () => {
  const lambdaContext = {
    functionName: 'lambda-function-name',
    getRemainingTimeInMillis: () => { return 100000; }
  };
  let lambdaClient;
  let s3Client;
  let sns;

  before(() => {
    awsMock.mock('S3', 'getObject', {
      Body: `email address;first name;last name
em1@examplemail.com;firstName1;lastName1
em1@examplemail.com;firstName12;lastName12
em2@examplemail.com;firstName2;lastName2`,
      Metadata: {
        headers: '{"email address":"email", "first name":"name","last name":"surname", "some-header":"false", "other-header":false}'
      }
    });
    awsMock.mock('IotData', 'publish', true);
    sinon.stub(List, 'update').resolves('Ok');
    sinon.stub(List, 'get').resolves({});
    sinon.spy(List, 'appendMetadataAttributes');

    sinon.stub(Recipient, 'saveAll').resolves('Ok');
    awsMock.mock('Lambda', 'invoke', 'ok');
    lambdaClient = new AWS.Lambda();
    s3Client = new AWS.S3();
    awsMock.mock('SNS', 'publish');
    sns = new AWS.SNS();
    process.env.UPDATE_IMPORT_STATUS_TOPIC_ARN = 'update-import-topic-arn';
  });

  after(() => {
    awsMock.restore('S3');
    awsMock.restore('Lambda');
    awsMock.restore('IotData');
    Recipient.saveAll.restore();
    List.update.restore();
    List.get.restore();
    List.appendMetadataAttributes.restore();
    awsMock.restore('SNS');
    delete process.env.IOT_ENDPOINT;
  });

  // TODO: Add error ocurred case
  describe('#importAll', () => {
    context('when a csv file uploaded', () => {
      const serviceParams = {
        s3Event: {
          bucket: {
            name: 'Random S3 import bucket'
          },
          object: {
            key: 'userId.listId#1.amarker.csv'
          }
        }
      };
      it('imports recipients', (done) => {
        const importRecipientsService = new ImportRecipientsService(serviceParams, s3Client, sns, lambdaClient, lambdaContext);
        expect(importRecipientsService).to.have.property('listId', 'listId#1');
        expect(importRecipientsService).to.have.property('fileExt', 'csv');
        expect(importRecipientsService).to.have.property('importOffset', 0);
        expect(importRecipientsService).to.have.deep.property('s3Event', serviceParams.s3Event);
        importRecipientsService.importAll().then(() => {
          expect(Recipient.saveAll).to.have.been.called;
          const args = Recipient.saveAll.lastCall.args[0];
          expect(args.length).to.equals(2);

          expect(args[0].userId).to.equals('userId');
          expect(args[0].listId).to.equals('listId#1');
          expect(args[0].email).to.equals('em1@examplemail.com');
          expect(args[0].status).to.equals('subscribed');
          expect(args[0].isConfirmed).to.be.true;
          expect(args[0].metadata).to.deep.equals({ name: 'firstName1', surname: 'lastName1' });

          expect(args[1].userId).to.equals('userId');
          expect(args[1].listId).to.equals('listId#1');
          expect(args[1].email).to.equals('em2@examplemail.com');
          expect(args[1].status).to.equals('subscribed');
          expect(args[1].isConfirmed).to.be.true;
          expect(args[1].metadata).to.deep.equals({ name: 'firstName2', surname: 'lastName2' });

          expect(List.update).to.have.been.calledWithExactly({processed: false}, 'userId', 'listId#1');
          expect(List.appendMetadataAttributes).to.have.been.calledWithExactly(['name', 'surname'], {userId: 'userId', listId: 'listId#1'});

          // expect(sns.publish.callCount).to.equal(1);
          const payload = JSON.parse(sns.publish.lastCall.args[0].Message);
          expect(payload).to.have.property('importStatus', 'success');

          done();
        }).catch((e) => console.log(e, e.stack));
      });
    });
  });
});
