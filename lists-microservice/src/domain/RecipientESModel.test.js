import '../lib/specHelper';
import RecipientESModel from './RecipientESModel';
import ElasticSearch from '../lib/elasticsearch';
import * as searchRecipientsEsQuery from '../fixtures/searchRecipientsEsQuery.json';

describe('RecipientESModel', () => {
  describe('search', () => {

    before(() => {
      const expectedQuery = searchRecipientsEsQuery.default;
      sinon.stub(ElasticSearch, 'search')
        .withArgs(sinon.match.any, sinon.match.any, expectedQuery)
        .resolves({ hits: { hits: [{ _source: 'result' }], total: 1 } });
    });
    after(() => {
      ElasticSearch.search.restore();
    });
    it('supports complex queries with full text search and filters', async () => {
      const params = {
        q: 'carlos',
        status: 'subscribed',
        listId: 'my-list-id',
        from: 0,
        size: 10
      };
      const results = await RecipientESModel.search(params);
      expect(results).to.exist;
    });
  });
});
