import '../lib/specHelper';
import RecipientModel from './RecipientModel';


describe('RecipientModel', () => {
  const tableName = 'RecipientModels-table';
  const recipientId = 'recipientId';
  const listId = 'thatListId';
  let tNameStub;
  const recipientHashKey = 'listId';
  const recipientRangeKey = 'id';

  before(() => {
    sinon.stub(RecipientModel, '_client').resolves(true);
  });


  describe('#emailBeginsWith', () => {
    const emailIndex = 'email-index-name';
    const stubResult = 'some-result';
    let indexStub;

    before(() => {
      sinon.stub(RecipientModel, 'allBy').resolves(stubResult);
    });

    it('calls the DynamoDB get method with correct params', (done) => {
      const email = 'david';
      RecipientModel.emailBeginsWith(listId, email).then((result) => {
        const expectedOptions = { range: { bw: { email } }, indexName: RecipientModel.emailIndex };
        expect(RecipientModel.allBy).to.have.been.calledWithExactly(recipientHashKey, listId, expectedOptions);
        expect(result).to.equal(stubResult);
        done();
      }).catch(done);
    });

    after(() => {
      RecipientModel.allBy.restore();
    });
  });

  describe('#allByStatus', () => {
    const statusIndex = 'email-index-name';
    const stubResult = 'some-result';

    before(() => {
      sinon.stub(RecipientModel, 'allBy').resolves(stubResult);
    });

    it('calls the DynamoDB get method with correct params', (done) => {
      const status = 'success';
      RecipientModel.allByStatus(listId, status).then((result) => {
        const expectedOptions = { range: { eq: { status } }, indexName: RecipientModel.statusIndex };
        expect(RecipientModel.allBy).to.have.been.calledWithExactly(recipientHashKey, listId, expectedOptions);
        expect(result).to.equal(stubResult);
        done();
      }).catch(done);
    });

    after(() => {
      RecipientModel.allBy.restore();
    });
  });

  after(() => {
    RecipientModel._client.restore();
  });
});
