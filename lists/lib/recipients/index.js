import { strip } from 'eskimo-stripper';
import request from 'request-promise';
import omitEmpty from 'omit-empty';
import base64url from 'base64-url';
import moment from 'moment';
import { List, ListSegment, Recipient } from 'moonmail-models';
import ElasticSearch from '../elasticsearch/index';

function validRecipient(recipient) {
  return !!recipient.listId && !!recipient.id && !!recipient.createdAt && !!recipient.email;
}

const Recipients = {
  indexName: process.env.ES_RECIPIENTS_INDEX_NAME,
  indexType: process.env.ES_RECIPIENTS_INDEX_TYPE,
  client: ElasticSearch.createClient({}),

  listFilterCondition: listId => ({ condition: { queryType: 'match', fieldToQuery: 'listId', searchTerm: listId }, conditionType: 'filter' }),
  subscribedCondition: () => ({ condition: { queryType: 'match', fieldToQuery: 'status', searchTerm: 'subscribed' }, conditionType: 'filter' }),
  defaultConditions(listId) {
    return [this.listFilterCondition(listId)];
  },

  buildESId(recipient) {
    return `${recipient.listId}-${recipient.id}`;
  },

  createESRecipient(id, recipient) {
    if (!validRecipient(recipient)) return Promise.resolve();
    const recipientToIndex = Object.assign({}, recipient, { createdAt: moment.unix(recipient.createdAt).utc().format() });
    return ElasticSearch.createOrUpdateDocument(this.client, this.indexName, this.indexType, id, recipientToIndex);
  },

  updateESRecipient(id, newRecipient) {
    if (!validRecipient(newRecipient)) return Promise.resolve();
    const recipientToIndex = Object.assign({}, newRecipient, { createdAt: moment.unix(newRecipient.createdAt).utc().format() });
    return ElasticSearch.createOrUpdateDocument(this.client, this.indexName, this.indexType, id, recipientToIndex);
  },

  deleteESRecipient(id) {
    return ElasticSearch.deleteDocument(this.client, this.indexName, this.indexType, id).catch(Promise.resolve);
  },

  searchRecipientsByListAndConditions(listId, conditions, { from = 0, size = 10 }) {
    return this.searchRecipientsByConditions([...conditions, ...this.defaultConditions(listId)], { from, size });
  },

  searchRecipientsByConditions(conditions, { from = 0, size = 10 }) {
    return ListSegment.validateConditions(conditions)
      .then(conditions => ElasticSearch.buildQueryFilters(conditions).from(from).size(size))
      .then(query => ElasticSearch.search(this.client, this.indexName, this.indexType, query.build()))
      .then(esResult => ({ items: esResult.hits.hits.map(hit => hit._source), total: esResult.hits.total }));
  },

  /**
   * TODO: Fixme
   */
  updateRecipientMetadata(recipient, newData) {
    const cfIpAddress = (newData['X-Forwarded-For'] || ',').split(',').pop();
    const updatedIpAddress = newData['CloudFront-Viewer-Country'] && cfIpAddress ? cfIpAddress : (recipient.metadata || {}).ip || null;

    const newMetadata = Object.assign({}, recipient.metadata, omitEmpty({
      ip: updatedIpAddress,
      country_code: newData['CloudFront-Viewer-Country'],
      accept_language: newData['Accept-Language'],
      desktop_access: newData['CloudFront-Is-Desktop-Viewer'],
      mobile_access: newData['CloudFront-Is-Mobile-Viewer'],
      smart_tv_access: newData['CloudFront-Is-SmartTV-Viewer'],
      tablet_accees: newData['CloudFront-Is-Tablet-Viewer'],
      user_agent: newData['User-Agent'],
      client: newData['X-Requested-With']
    }));


    if (!newMetadata.ip) {
      return Recipient.update({ metadata: newMetadata }, recipient.listId, recipient.id);
    }
    return Promise.resolve(newMetadata)
      .then(metadata => request(`https://freegeoip.net/json/${metadata.ip.trim()}`))
      .then((r) => JSON.parse(r))
      .then(updatedData => Object.assign({}, newMetadata, {
        country_name: updatedData.country_name,
        region_code: updatedData.region_code,
        region_name: updatedData.region_name,
        city: updatedData.city,
        zip_code: updatedData.zip_code,
        time_zone: updatedData.time_zone,
        latitude: updatedData.latitude,
        longitude: updatedData.longitude,
        metro_code: updatedData.metro_code
      }))
      .then(updatedMetadata => Recipient.update({ metadata: updatedMetadata }, recipient.listId, recipient.id));
  },

  processOpenOrClickStream(records) {
    return Promise.resolve();
    // return Promise.map(records, record => this.processOpenOrClick(record), { concurrency: 5 });
  },

  processOpenOrClick(record) {
    if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
      const item = strip(record.dynamodb.NewImage);
      if (!item.metadata) return Promise.resolve();
      const emailAdress = base64url.decode(item.recipientId);
      return Recipient.allByEmail(emailAdress, { limit: 250 })
        .then(result => Promise.map(result.items, recipient => this.updateRecipientMetadata(recipient, item.metadata), { concurrency: 2 }));
    }
    return Promise.resolve();
  },

  // TODO: migrate to ES
  totalRecipients(userId) {
    return List.allBy('userId', userId)
      .then(lists => lists.items.filter(l => l.subscribedCount).reduce((accum, next) => (accum + next.subscribedCount), 0));
  },

  syncRecipientStreamWithES(records) {
    return Promise.map(records, record => this.syncRecipientRecordWithES(record), { concurrency: 10 });
  },

  syncRecipientRecordWithES(record) {
    if (record.eventName === 'INSERT') {
      const item = strip(record.dynamodb.NewImage);
      return this.createESRecipient(this.buildESId(item), item);
    }
    if (record.eventName === 'MODIFY') {
      const item = strip(record.dynamodb.NewImage);
      return this.updateESRecipient(this.buildESId(item), item);
    }
    if (record.eventName === 'REMOVE') return this.deleteESRecipient(this.buildESId(strip(record.dynamodb.OldImage)));
  }
};

export default Recipients;
