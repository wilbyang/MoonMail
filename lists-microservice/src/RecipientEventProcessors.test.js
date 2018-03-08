import './lib/specHelper';
import Api from './Api';
import RecipientEventProcessors from './RecipientEventProcessors';
import recipientEventStream from './fixtures/recipientEventStream.json';
import recipientEventStreamInvalidEvents from './fixtures/recipientEventStreamInvalidEvents.json';

describe('RecipientEventProcessors', () => {
  describe('.eventStreamProcessor', () => {
    context('when the batch contains valid events', () => {
      beforeEach(() => {
        sinon.stub(Api, 'importRecipientsBatch')
          .resolves({});
  
        sinon.stub(Api, 'createRecipientsBatch')
          .resolves({});
  
        sinon.stub(Api, 'updateRecipientsBatch')
          .resolves({});
      });
      afterEach(() => {
        Api.importRecipientsBatch.restore();
        Api.createRecipientsBatch.restore();
        Api.updateRecipientsBatch.restore();
      });
  
      it('processes the stream', (done) => {
        RecipientEventProcessors.eventStreamProcessor(recipientEventStream, {}, (err, actual) => {
          expect(err).to.not.exist;
          done();
        });
      });
    });

    context('when the batch contains invalid events', () => {
      beforeEach(() => {
        sinon.stub(Api, 'importRecipientsBatch')
          .resolves({});
  
        sinon.stub(Api, 'createRecipientsBatch')
          .resolves({});
  
        sinon.stub(Api, 'updateRecipientsBatch')
          .resolves({});
      });
      afterEach(() => {
        Api.importRecipientsBatch.restore();
        Api.createRecipientsBatch.restore();
        Api.updateRecipientsBatch.restore();
      });
  
      it('aborts with an error', (done) => {
        RecipientEventProcessors.eventStreamProcessor(recipientEventStreamInvalidEvents, {}, (err, actual) => {
          expect(err).to.exist;
          expect(Api.importRecipientsBatch).not.to.have.been.called;
          expect(Api.createRecipientsBatch).not.to.have.been.called;
          expect(Api.updateRecipientsBatch).not.to.have.been.called;
          done();
        });
      });
    });
  });
});
