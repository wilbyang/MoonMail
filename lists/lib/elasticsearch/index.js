import AWS from 'aws-sdk';
import AWSESConnection from 'http-aws-es';
import Elasticsearch from 'elasticsearch';
import bodyBuilder from 'bodybuilder';

function awsCredentials() {
  return new AWS.EnvironmentCredentials('AWS');
}

const ElasticSearch = {
  deleteDocument(esClient, indexName, indexType, id) {
    return esClient.delete({
      index: indexName,
      type: indexType,
      id
    });
  },

  createOrUpdateDocument(esClient, indexName, indexType, id, item) {
    return esClient.index({
      index: indexName,
      type: indexType,
      id,
      body: item
    });
  },

  search(esClient, indexName, indexType, queryBody) {
    return esClient.search({
      index: indexName,
      type: indexType,
      body: queryBody
    });
  },

  buildQueryFilters(conditions) {
    return conditions.reduce((aggregatedBody, nextCondition) => aggregatedBody.filter(nextCondition.queryType, nextCondition.fieldToQuery, nextCondition.searchTerm), bodyBuilder());
  },

  createClient({ credentials = awsCredentials(), elasticSearchHost = process.env.ES_HOST, elasticSearchRegion = process.env.ES_REGION }) {
    return new Elasticsearch.Client({
      hosts: elasticSearchHost,
      connectionClass: AWSESConnection,
      amazonES: {
        region: elasticSearchRegion,
        credentials
      }
    });
  }
};

export default ElasticSearch;
