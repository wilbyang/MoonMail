import Joi from 'joi';
import moment from 'moment';
import omitEmpty from 'omit-empty';
import ElasticSearch from '../lib/elasticsearch';
import RecipientModel from './RecipientModel';


const indexName = process.env.ES_RECIPIENTS_INDEX_NAME;
const indexType = process.env.ES_RECIPIENTS_INDEX_TYPE;

const listFilterCondition = listId => ({ condition: { queryType: 'match', fieldToQuery: 'listId', searchTerm: listId }, conditionType: 'filter' });
const subscribedCondition = () => ({ condition: { queryType: 'match', fieldToQuery: 'status', searchTerm: 'subscribed' }, conditionType: 'filter' });
const defaultConditions = listId => [listFilterCondition(listId)];

const conditionsSchema = Joi.array().items(Joi.object().keys({
  conditionType: Joi.string().default('filter'),
  condition: Joi.object().keys({
    queryType: Joi.string().required(),
    fieldToQuery: Joi.string().required(),
    searchTerm: Joi.any().required()
  })
})).min(1);

const createSchema = Joi.object({
  listId: Joi.string().required(),
  userId: Joi.string().required(),
  id: Joi.string().required(),
  email: Joi.string().required().email(),
  subscriptionOrigin: Joi.string().valid(Object.values(RecipientModel.subscriptionOrigins)).required(),
  isConfirmed: Joi.boolean(),
  status: Joi.string().valid(Object.values(RecipientModel.statuses)).required(),
  riskScore: Joi.number(),
  metadata: Joi.object().pattern(/^[A-Za-z_]+[A-Za-z0-9_]*$/, Joi.required()),
  systemMetadata: Joi.object().pattern(/^[A-Za-z_]+[A-Za-z0-9_]*$/, Joi.required()),
  unsubscribedAt: Joi.number(),
  subscribedAt: Joi.number(),
  unsubscribedCampaignId: Joi.string(),
  bouncedAt: Joi.number(),
  complainedAt: Joi.number(),
  createdAt: Joi.number(),
  updatedAt: Joi.number()
});

function create(recipient) {
  const esId = RecipientModel.buildGlobalId({ recipient });
  return RecipientModel.validate(createSchema, omitEmpty(recipient), { allowUnknown: true })
    .then(newRecipient => ElasticSearch.createOrUpdateDocument(indexName, indexType, esId, newRecipient));
}

function update(recipient) {
  return create(recipient);
}

function remove(id) {
  return ElasticSearch.deleteDocument(indexName, indexType, id);
}

function find({ listId, recipientId }) {
  return ElasticSearch.getDocument(indexName, indexType, RecipientModel.buildGlobalId({ listId, recipientId }))
    .then(result => result._source);
}

function searchByListAndConditions(listId, conditions, { from = 0, size = 10 }) {
  return searchByConditions([...conditions, ...defaultConditions(listId)], { from, size });
}

function searchByConditions(conditions, { from = 0, size = 10 }) {
  return Joi.validate(conditions, conditionsSchema)
    .then(validConditions => ElasticSearch.buildQueryFilters(validConditions).from(from).size(size))
    .then(query => ElasticSearch.search(indexName, indexType, query.build()))
    .then(esResult => ({ items: esResult.hits.hits.map(hit => hit._source), total: esResult.hits.total }));
}

export default {
  find,
  create,
  update,
  remove,
  searchByListAndConditions
};

