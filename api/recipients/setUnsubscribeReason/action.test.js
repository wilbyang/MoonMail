import * as chai from 'chai';
import { respond } from './action';
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { Report, Recipient, List } from 'moonmail-models';

const expect = chai.expect;

describe('setUnsubscribeReason', () => {
  const recipientId = 'recipient-id';
  const listId = 'list-id';
  const campaignId = 'campaign-id';
  const recipient = { id: 'recipient-id' };
  const complaintReason = 'complaint';
  const nonComplaintReason = 'non-complaint';
  let event;

  describe('#respond()', () => {
    beforeEach(() => {
      sinon.stub(Recipient, 'update').resolves(recipient);
      sinon.stub(Report, 'incrementComplaints').resolves({});
      sinon.stub(List, 'increment').resolves({});
    });

    context('when the event is valid', () => {
      context('when the reason is a complaint', () => {

        before(() => {
          event = { listId, recipientId, campaignId, requestBody: { reason: complaintReason } };
        });

        it('updates the list', (done) => {
          respond(event, (err, result) => {
            expect(Recipient.update).to.have.been.calledTwice;
            expect(Report.incrementComplaints).to.have.been.calledOnce;
            expect(List.increment).to.have.been.calledOnce;
            expect(err).to.not.exist;
            expect(result).to.exist;
            done();
          });
        });
      });

      context('when the reason is not a complaint', () => {

        before(() => {
          event = { listId, recipientId, campaignId, requestBody: { reason: nonComplaintReason } };
        });

        it('updates the list', (done) => {
          respond(event, (err, result) => {
            expect(Recipient.update).to.have.been.calledOnce;
            expect(Report.incrementComplaints).not.to.have.been.called;
            expect(List.increment).not.to.have.been.called;
            expect(err).to.not.exist;
            expect(result).to.exist;
            done();
          });
        });
      });

    });

    context('when the event is not valid', () => {
      before(() => {
        event = {};
      });

      it('returns an error message', (done) => {
        respond(event, (err, result) => {
          expect(result).to.not.exist;
          expect(err).to.exist;
          expect(Recipient.update).not.to.be.called;
          done();
        });
      });
    });

    afterEach(() => {
      Recipient.update.restore();
      Report.incrementComplaints.restore();
      List.increment.restore();
    });
  });
});
