import * as chai from 'chai';
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
import * as sinon from 'sinon';
import { List } from 'moonmail-models';
import { RecipientsCounterService } from './recipients_counter_service';
import * as sinonAsPromised from 'sinon-as-promised';
import * as recipientEvents from './fixtures/recipients_dynamo_stream.json';
const awsMock = require('aws-sdk-mock');
const AWS = require('aws-sdk');

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('RecipientsCounterService', () => {
  let recipientsCounterService;

  describe('#updateCounters()', () => {
    before(() => {
      recipientsCounterService = new RecipientsCounterService(recipientEvents);
      sinon.stub(List, 'incrementAll').resolves('Ok');
    });

    it('updates List statistics accordingly', (done) => {
      recipientsCounterService.updateCounters().then(() => {
        expect(List.incrementAll).to.have.been.called;
        done();
      });
    });

    after(() => {
      List.incrementAll.restore();
    });
  });


  describe('#_getListIdUserIdMapping()', () => {
    before(() => {
      recipientsCounterService = new RecipientsCounterService(recipientEvents);
    });
    it('returns listId and userId mappings from the stream', () => {
      expect(recipientsCounterService._getListIdUserIdMapping()).to.deep.equal({ 'my-list': 'user-id', 'my-list2': 'user-id' });
    });
  });

  describe('#_getIncrements()', () => {
    before(() => {
      recipientsCounterService = new RecipientsCounterService(recipientEvents);
    });
    it('returns counters for the lists attributes according to events operations', () => {
      expect(recipientsCounterService._getIncrements()).to.deep.equal({
        'my-list':
        {
          total: 1,
          bouncedCount: 0,
          complainedCount: 0,
          subscribedCount: 1,
          awaitingConfirmationCount: 0,
          unsubscribedCount: 0
        },
        'my-list2':
        {
          total: 0,
          bouncedCount: 0,
          complainedCount: 0,
          subscribedCount: 0,
          awaitingConfirmationCount: 0,
          unsubscribedCount: 0
        }
      });
    });
  });
});
