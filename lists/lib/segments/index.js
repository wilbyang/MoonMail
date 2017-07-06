import cuid from 'cuid';
import { ListSegment } from 'moonmail-models';
import ElasticSearch from '../elasticsearch/index';

const Segments = {

  indexName: process.env.ES_RECIPIENTS_INDEX_NAME,
  indexType: process.env.ES_RECIPIENTS_INDEX_TYPE,
  client: ElasticSearch.createClient({}),

  listSegmentMembersFromConditions(conditions, from, size) {
    const query = ElasticSearch.buildQueryFilters(conditions).from(from).size(size);
    return ElasticSearch.search(this.client, this.indexName, this.indexType, query.build())
      .then((esResult) => {
        return { items: esResult.hits.hits.map(hit => Object.assign({}, { _id: hit._id }, hit._source)) };
      });
  },

  getSegment(listId, id) {
    return ListSegment.get(listId, id);
  },

  createSegment(segment) {
    const segmentToSave = Object.assign({}, { id: cuid() }, segment);
    return ListSegment.save(segmentToSave).then(() => segmentToSave);
  },

  updateSegment(newSegment, listId, id) {
    return ListSegment.update(newSegment, listId, id);
  },

  listSegments(listId, options = {}) {
    return ListSegment.allBy('listId', listId, Object.assign({}, { limit: 250 }, options));
  },

  archiveSegment(listId, id) {
    return this.updateSegment({ archived: true }, listId, id);
  },

  unArchiveSegment(listId, id) {
    return this.updateSegment({ archived: false }, listId, id);
  }
};

export default Segments;
