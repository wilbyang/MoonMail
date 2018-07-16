import base64url from 'base64-url';
import omitEmpty from 'omit-empty';
import request from 'request-promise';
import { List } from 'moonmail-models';
import { User } from '../../../lib/models/user';
import qs from 'qs';
import { ListSubscribeService } from '../lib/list_subscribe_service';
import { debug } from '../../../lib/index';
import { ApiErrors } from '../../../lib/errors';

export function respond(event, cb) {
  debug('= subscribeToList.action', JSON.stringify(event));
  const params = getParameters(event);

  checkParams(params)
    .then(decodeUserId)
    .then(getList)
    .then(getUser)    
    .then(assignNewRecipient)
    .then(handleMetaData)
    .then(subscribeToList)
    .then(({ list }) => handleResponse(null, { listName: list.name }, event, cb))
    .catch((err) => handleResponse(err, null, event, cb))
}

const checkParams = async (params) => {
  debug('= subscribeToList.checkParams', JSON.stringify(params))
  if (!params.listId || !params.recipient || !params.encodedUserId) {
    throw 'Missing params'
  }

  return params
}

const decodeUserId = async (params) => {
  debug('= subscribeToList.decodeUserId', JSON.stringify(params))
  const userId = base64url.decode(params.encodedUserId)

  return { params, userId }
}

const getList = async ({ params, userId }) => {
  debug('= subscribeToList.getList', JSON.stringify(userId))
  const list = await List.get(userId, params.listId)

  return { params, userId, list }
}

const getUser = async ({ params, userId, list }) => {
  const user = await User.get(userId)

  return { params, userId, list, user }
}

const assignNewRecipient = async ({ params, userId, list, user }) => {
  debug('= subscribeToList.assignNewRecipient', JSON.stringify(list))
  const newRecipient = Object.assign({}, params.recipient, { userId });
  delete newRecipient.u;

  return { params, userId, list, newRecipient, user }
}

const handleMetaData = async ({ params, userId, list, newRecipient, user }) => {
  debug('= subscribeToList.handleMetaData', JSON.stringify(newRecipient))
  const systemMetadata = await discoverFieldsFromRequestMetadata(JSON.parse(params.headers))
  const recipientWithSystemMetadata = Object.assign({}, newRecipient, { systemMetadata })

  return { userId, list, recipientWithSystemMetadata, user }
}

const subscribeToList = async ({ userId, list, recipientWithSystemMetadata, user }) => {
  debug('= subscribeToList.subscribeToList', JSON.stringify(recipientWithSystemMetadata))
  await ListSubscribeService.subscribe(list, recipientWithSystemMetadata, userId, user)

  return { list }
}

function findDetectedDevice(metadata) {
  if (metadata['CloudFront-Is-Desktop-Viewer'] === 'true') { return 'desktop'; }
  if (metadata['CloudFront-Is-Mobile-Viewer'] === 'true') { return 'mobile'; }
  if (metadata['CloudFront-Is-SmartTV-Viewer'] === 'true') { return 'smartTv'; }
  if (metadata['CloudFront-Is-Tablet-Viewer'] === 'true') { return 'tablet'; }
  return 'unknown';
}

function discoverFieldsFromRequestMetadata(requestMetadata) {
  const cfIpAddress = (requestMetadata['X-Forwarded-For'] || ',').split(',').shift().trim();
  const acceptLanguage = (requestMetadata['Accept-Language'] || ',').split(',').shift().trim();
  const language = (acceptLanguage || '_').split(/\-|_/).shift().trim();
  const updatedMetadata = omitEmpty({
    ip: cfIpAddress,
    countryCode: requestMetadata['CloudFront-Viewer-Country'],
    acceptLanguageHeader: requestMetadata['Accept-Language'],
    acceptLanguage,
    language,
    detectedDevice: findDetectedDevice(requestMetadata),
    userAgent: requestMetadata['User-Agent']
  });
  if (updatedMetadata.userAgent.match(/Zapier/)) return Promise.resolve({});
  return request(`https://freegeoip.net/json/${cfIpAddress}`)
    .then(result => JSON.parse(result))
    .then(geoLocationData => omitEmpty(Object.assign({}, updatedMetadata, {
      countryName: geoLocationData.country_name,
      regionCode: geoLocationData.region_code,
      regionName: geoLocationData.region_name,
      city: geoLocationData.city,
      zipCode: geoLocationData.zip_code,
      timeZone: geoLocationData.time_zone,
      location: {
        lat: geoLocationData.latitude,
        lon: geoLocationData.longitude
      },
      metroCode: geoLocationData.metro_code
    }))).catch(error => Promise.resolve({})); // Avoid breaking the request if freegeoip fails
}

function getParameters(event) {
  return event.json ? event : getFormParameters(event);
}

function getFormParameters(event) {
  const recipient = qs.parse(event.recipient);
  const encodedUserId = recipient.u;
  return { recipient, encodedUserId, listId: event.listId, headers: event.headers };
}

function handleResponse(error, success, event, cb) {
  debug('= subscribeToList.handleResponse', JSON.stringify(error), JSON.stringify(success))
  if (error && error.name === 'RecipientAlreadyExists') { error = { email: 'E-mail address already exists!' } }
  if (event.json) {
    return ajaxResponse(error, success, cb);
  } else {
    return redirectResponse(error, success, cb);
  }
}

function ajaxResponse(error, success, cb) {
  if (error) {
    const errorCode = error.code;
    if (errorCode !== 'MessageRejected' && errorCode !== 'Throttling') return cb(ApiErrors.response(error));
    return cb(ApiErrors.response({
      status: 429,
      message: 'Daily message quota exceeded. No more double opt in confirmation emails can be sent to recipients on your MoonMail account.'
    }));
  }
  return cb(null, success);
}

function redirectResponse(error, success, cb) {
  const url = error ? process.env.ERROR_PAGE : process.env.SUCCESS_PAGE;
  return cb(null, url);
}
