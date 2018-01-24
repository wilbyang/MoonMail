import App from './App';
import Api from './Api';
import UserContext from './lib/UserContext';
import Recipients from './domain/Recipients';
import HttpUtils from './lib/HttpUtils';
import RecipientModel from './domain/RecipientModel';

async function createRecipient(event, context, callback) {
  try {
    App.configureLogger(event, context);
    App.logger().info('createRecipient', JSON.stringify(event));
    const { recipient } = JSON.parse(event.body);
    const user = await UserContext.byApiKey(event.requestContext.identity.apiKey);
    await Api.publishRecipientCreatedEvent({ listId: event.pathParameters.listId, userId: user.id, createRecipientPayload: recipient, subscriptionOrigin: RecipientModel.subscriptionOrigins.api });
    const recourceLocation = `/${event.pathParameters.listId}/recipients/${Recipients.buildId(recipient)}`;
    HttpUtils.buildApiResponse({ statusCode: 202, headers: { Location: recourceLocation } }, callback);
  } catch (error) {
    App.logger().error(error);
    HttpUtils.apiErrorHandler(error, callback);
  }
}

async function updateRecipient(event, context, callback) {
  try {
    App.configureLogger(event, context);
    App.logger().info('updateRecipient', JSON.stringify(event));
    const params = JSON.parse(event.body);
    const user = await UserContext.byApiKey(event.requestContext.identity.apiKey);
    await Api.publishRecipientUpdatedEvent({ listId: event.pathParameters.listId, userId: user.id, recipientId: event.pathParameters.recipientId, updateRecipientPayload: params });
    HttpUtils.buildApiResponse({ statusCode: 202 }, callback);
  } catch (error) {
    App.logger().error(error);
    HttpUtils.apiErrorHandler(error, callback);
  }
}

async function listRecipients(event, context, callback) {
  try {
    App.configureLogger(event, context);
    App.logger().info('listRecipients', JSON.stringify(event));
    const user = await UserContext.byApiKey(event.requestContext.identity.apiKey);
    const qs = event.queryStringParameters || {};
    const page = qs.page || 1;
    const limit = qs.limit || 10;
    const options = { from: (page - 1) * limit, size: Math.min(limit, 100) };
    // FIXME: Improve according to:
    // https://bitbucket.org/micro-apps/monei-core-serverless/src/38856c21a98cacc775cf0518e0d2bd8f488b45e9/node/users/lib/index.js?at=master&fileviewer=file-view-default
    const conditions = qs.status ? [{ condition: { queryType: 'match', fieldToQuery: 'status', searchTerm: qs.status }, conditionType: 'filter' }] : [];
    // const conditions = qs.status ? [{ condition: { queryType: 'match', fieldToQuery: 'status.keyword', searchTerm: qs.status }, conditionType: 'filter' }] : [];
    // const conditions = qs.status ? [{ condition: { queryType: 'terms', fieldToQuery: 'status.keyword', searchTerm: [qs.status] }, conditionType: 'filter' }] : [];
    const recipients = await Api.listRecipients({ listId: event.pathParameters.listId, conditions, options });
    HttpUtils.buildApiResponse({ statusCode: 200, body: recipients }, callback);
  } catch (error) {
    App.logger().error(error, error.stack);
    HttpUtils.apiErrorHandler(error, callback);
  }
}

async function getRecipient(event, context, callback) {
  try {
    App.configureLogger(event, context);
    App.logger().info('getRecipient', JSON.stringify(event));
    const user = await UserContext.byApiKey(event.requestContext.identity.apiKey);
    const recipient = await Api.getRecipient({ listId: event.pathParameters.listId, recipientId: event.pathParameters.recipientId });
    HttpUtils.buildApiResponse({ statusCode: 200, body: recipient }, callback);
  } catch (error) {
    App.logger().error(error, error.stack);
    HttpUtils.apiErrorHandler(error, callback);
  }
}

async function getAllLists(event, context, callback) {
  try {
    App.configureLogger(event, context);
    App.logger().info('getAllLists', JSON.stringify(event));
    const user = await UserContext.byApiKey(event.requestContext.identity.apiKey);
    const qs = event.queryStringParam;
    const limit = 100;
    const options = { limit };
    const { items } = await Api.getAllLists(user.id, options);
    HttpUtils.buildApiResponse({ statusCode: 200, body: { items } }, callback);
  } catch (error) {
    App.logger().error(error, error.stack);
    HttpUtils.apiErrorHandler(error, callback);
  }
}

export default {
  createRecipient,
  updateRecipient,
  listRecipients,
  getRecipient,
  getAllLists
};
