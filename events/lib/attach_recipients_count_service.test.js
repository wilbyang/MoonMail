import * as chai from 'chai';
import * as sinon from 'sinon';
import { AttachRecipientsCountService } from './attach_recipients_count_service';
import awsMock from 'aws-sdk-mock';
import AWS from 'aws-sdk';
import { List } from 'moonmail-models';
import * as sinonAsPromised from 'sinon-as-promised';

const expect = chai.expect;
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

describe('AttachRecipientsCountService', () => {
  const userId = 'user-id';
  const someList = {id: 'list-id', subscribedCount: 10000, userId};
  const anotherList = {id: 'another-list-id', subscribedCount: 5000, userId};
  const canonicalMessage = {
    userId,
    campaign: {id: 'campaignId', listIds: [someList.id, anotherList.id]}
  };
  const attachSenderTopicArn = 'some-topic-arn';
  process.env.ATTACH_SENDER_TOPIC_ARN = attachSenderTopicArn;
  let getListStub;
  let snsClient;
  let service;

  beforeEach(() => {
    awsMock.mock('SNS', 'publish', {});
    snsClient = new AWS.SNS();
    getListStub = sinon.stub(List, 'get');
    getListStub
      .withArgs(userId, someList.id).resolves(someList)
      .withArgs(userId, anotherList.id).resolves(anotherList);
    service = new AttachRecipientsCountService(canonicalMessage, snsClient);
  });

  describe('#attachCount', () => {
    it('should resolve the canonical message with the recipients count', done => {
      const recipientsCount = someList.subscribedCount + anotherList.subscribedCount;
      const expectedMessage = Object.assign({}, canonicalMessage, {recipientsCount});
      service.attachCount().then(result => {
        expect(result).to.deep.equal(expectedMessage);
        done();
      }).catch(done);
    });

    it('should publish the canonical message with the recipients count to the SNS topic', done => {
      service.attachCount().then(result => {
        const expectedParams = {
          TopicArn: attachSenderTopicArn,
          Message: JSON.stringify(result)
        };
        expect(snsClient.publish).to.have.been.calledWith(expectedParams);
        done();
      }).catch(done);
    });
  });

  afterEach(() => {
    List.get.restore();
    awsMock.restore('SNS');
  });
});
