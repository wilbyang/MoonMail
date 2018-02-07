import './lib/specHelper';
import Api from './Api';
import RecipientQueries from './RecipientQueries';

describe('PublicHttpApi', () => {
  const apiKey = 'the-api-key';
  const user = { id: 'user-id', apiKey };
  const userId = user.id;
  const listId = 'some-list-id';
  const searchRecipientsParams = { q: 'some-query', status: 'some-status' };

  describe('#searchRecipients', () => {
    beforeEach(() => {
      sinon.stub(Api, 'searchRecipients')
        .withArgs(Object.assign({}, searchRecipientsParams, { listId }))
        .resolves({ items: [] });
    });
    afterEach(() => {
      Api.searchRecipients.restore();
    });

    it('searchs applying the filters from the event', (done) => {
      const event = Object.assign({}, { listId }, { options: searchRecipientsParams });
      RecipientQueries.searchRecipients(event, {}, (err, actual) => {
        expect(err).to.not.exist;
        const expected = { items: [] };
        expect(actual).to.deep.equals(expected);
        done();
      });
    });
  });
});
