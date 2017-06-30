import chai from 'chai';
import sinon from 'sinon';
import 'sinon-as-promised';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import ElasticSearch from '../elasticsearch/index';

const expect = chai.expect;
chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('ElasticSearch', () => {

  describe('#buildFilters', () => {
    const conditions = [
      { queryType: 'match', fieldToQuery: 'subscriberOrigin', searchTerm: 'signupForm' },
      { queryType: 'range', fieldToQuery: 'createdAt', searchTerm: { gte: 'now-30d/d' } }
    ];

    it('builds the query using conditions', () => {
      const query = ElasticSearch.buildQueryFilters(conditions).build();
      expect(JSON.stringify(query)).to.equals('');
    });
  });
});