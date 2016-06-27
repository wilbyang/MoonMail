'use strict';

import * as chai from 'chai';
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Report } from 'moonmail-models';
import { IncrementSentEmailsService } from './increment_sent_emails_service';
import * as event from './fixtures/sent_emails_stream.json';
import * as sinonAsPromised from 'sinon-as-promised';

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('IncrementSentEmailsService', () => {
  let sentService;
  const sentCount = {
    'my-campaign-id': 1,
    'my-new-campaign-id': 1
  };

  before(() => {
    sentService = new IncrementSentEmailsService(event.Records);
  });

  describe('#sentByCampaign()', () => {
    it('returns the count of clicks by campaign', (done) => {
      expect(sentService.sentByCampaign).to.deep.equal(sentCount);
      done();
    });
  });

  describe('#incrementCount()', () => {
    before(() => {
      sinon.stub(Report, 'incrementSent');
    });

    it('should save the clicks count', done => {
      const campaignId = '123';
      const count = 5;
      sentService.incrementCount(campaignId, count);
      expect(Report.incrementSent.callCount).to.equal(1);
      expect(Report.incrementSent).to.have.been.calledWithExactly(campaignId, count);
      done();
    });

    after(() => {
      Report.incrementSent.restore();
    });
  });

  describe('#incrementAll()', () => {
    before(() => {
      sinon.stub(Report, 'incrementSent').resolves('ok');
    });

    it('should save the clicks count', done => {
      sentService.incrementAll().then(() => {
        expect(Report.incrementSent.callCount).to.equal(2);
        Object.keys(sentCount).forEach(campaignId => {
          let count = sentCount[campaignId];
          expect(Report.incrementSent).to.have.been.calledWithExactly(campaignId, count);
        });
        done();
      }).catch(err => done(err));
    });

    after(() => {
      Report.incrementSent.restore();
    });
  });
});
