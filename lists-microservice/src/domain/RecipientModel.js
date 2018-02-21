import Joi from 'joi';
import moment from 'moment';
import base64url from 'base64-url';
import { BaseModel } from 'moonmail-models';
import stringifyObjectValues from '../lib/utils/stringifyObjectValues';
import uniqueArray from '../lib/utils/uniqueArray';

const statuses = {
  subscribed: 'subscribed',
  awaitingConfirmation: 'awaitingConfirmation',
  unsubscribed: 'unsubscribed',
  bounced: 'bounced',
  complaint: 'complained'
};

const subscriptionOrigins = {
  signupForm: 'signupForm',
  listImport: 'listImport',
  manual: 'manual',
  api: 'api'
};

export default class RecipientModel extends BaseModel {
  static get tableName() {
    return process.env.RECIPIENTS_TABLE;
  }

  static get emailIndex() {
    return process.env.EMAIL_INDEX_NAME;
  }

  static get statusIndex() {
    return process.env.RECIPIENT_STATUS_INDEX_NAME;
  }

  static get globalEmailIndex() {
    return process.env.RECIPIENT_GLOBAL_EMAIL_INDEX_NAME;
  }

  static get hashKey() {
    return 'listId';
  }

  static get rangeKey() {
    return 'id';
  }

  static get statuses() {
    return statuses;
  }

  static get subscriptionOrigins() {
    return subscriptionOrigins;
  }

  static get createSchema() {
    return Joi.object({
      listId: Joi.string().required(),
      userId: Joi.string().required(),
      id: Joi.string().required(),
      email: Joi.string().regex(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/).required(),
      subscriptionOrigin: Joi.string().valid(Object.values(RecipientModel.subscriptionOrigins)).required(),
      isConfirmed: Joi.boolean().when('status', { is: RecipientModel.statuses.awaitingConfirmation, then: Joi.only(false).default(false), otherwise: Joi.only(true).default(true) }),
      status: Joi.string().valid(RecipientModel.statuses.subscribed, RecipientModel.statuses.awaitingConfirmation).required(),
      metadata: Joi.object().pattern(/^[A-Za-z_]+[A-Za-z0-9_]*$/, Joi.required()),
      systemMetadata: Joi.object().pattern(/^[A-Za-z_]+[A-Za-z0-9_]*$/, Joi.required()),
      createdAt: Joi.number().default(moment().unix())
    });
  }

  static get updateSchema() {
    return Joi.object({
      status: Joi.string().valid(Object.values(RecipientModel.statuses)),
      isConfirmed: Joi.boolean(),
      metadata: Joi.object().pattern(/^[A-Za-z_]+[A-Za-z0-9_]*$/, Joi.required()),
      updatedAt: Joi.number().default(moment().unix())
    });
  }


  static buildId(recipient) {
    return base64url.encode(recipient.email);
  }

  static buildGlobalId({ listId, recipientId, recipient }) {
    const gidBuilder = (lId, recptId) => `${lId}-${recptId}`;
    if (recipient) return gidBuilder(recipient.listId, recipient.id);
    return gidBuilder(listId, recipientId);
  }

  static emailBeginsWith(listId, email, options = {}) {
    const indexOptions = {
      indexName: this.emailIndex,
      range: { bw: { email } }
    };
    const dbOptions = Object.assign({}, indexOptions, options);
    return this.allBy(this.hashKey, listId, dbOptions);
  }

  static allByStatus(listId, status, options = {}) {
    const indexOptions = {
      indexName: this.statusIndex,
      range: { eq: { status } }
    };
    const dbOptions = Object.assign({}, indexOptions, options);
    return this.allBy(this.hashKey, listId, dbOptions);
  }

  static allByEmail(email, options = {}) {
    const indexOptions = {
      indexName: this.globalEmailIndex
    };
    const dbOptions = Object.assign({}, indexOptions, options);
    return this.allBy('email', email, dbOptions);
  }

  static create(item, validationOptions) {
    const itemToSave = Object.assign({}, { id: this.buildId(item) }, item, { metadata: stringifyObjectValues(item.metadata || {}) });
    return super.create(itemToSave, validationOptions);
  }

  static batchCreate(items) {
    const itemsToSave = items.map(item => Object.assign({}, { id: this.buildId(item) }, item, { metadata: stringifyObjectValues(item.metadata || {}) }));
    return super.batchCreate(uniqueArray(itemsToSave));
  }
}

