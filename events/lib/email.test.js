'use strict';

import * as chai from 'chai';
const chaiAsPromised = require('chai-as-promised');
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Email } from './email';

chai.use(chaiAsPromised);

describe('Email', () => {
  const apiHost = 'the-api.com';
  process.env.API_HOST = apiHost;
  const metadata = {
    name: 'John',
    surname: 'Doe'
  };
  const bodyTemplate = 'Hi {{ name }} {{ surname }}, this email is for you!';
  const bodyNoTags = 'Hey you, check this out';
  const bodyParsed = `Hi ${metadata.name} ${metadata.surname}, this email is for you!`;
  const subjectTemplate = 'Hi {{ name }}!';
  const subjectNoTags = 'Hey you!';
  const subjectParsed = `Hi ${metadata.name}!`;
  const emailParams = {
    fromEmail: 'myemail@test.com',
    to: 'somerecipient@test.com',
    metadata
  };
  const recipientId = 'recipient-id';
  const listId = 'list-id';
  const campaignId = 'campaign-id';
  const emailWithTagsParams = Object.assign({body: bodyTemplate, subject: subjectTemplate, recipientId, listId, campaignId}, emailParams);
  const emailNoTagsParams = Object.assign({body: bodyNoTags, subject: subjectNoTags, recipientId, listId, campaignId}, emailParams);
  const emailWithTags = new Email(emailWithTagsParams, {footer: false});
  const emailNoTags = new Email(emailNoTagsParams, {footer: false});
  const emailWithFooter = new Email(emailNoTagsParams, {footer: true});
  const footer = '<p>some footer</p>';

  describe('#renderBody()', () => {
    context('when the body contains liquid tags', () => {
      it('returns the body with parsed liquid tags', (done) => {
        expect(emailWithTags.renderBody()).to.eventually.equal(bodyParsed).notify(done);
      });
    });
    context('when the body does not contain liquid tags', () => {
      it('returns the body unmodified', (done) => {
        expect(emailNoTags.renderBody()).to.eventually.equal(bodyNoTags).notify(done);
      });
    });
    context('when the footer option is passed', () => {
      before(() => sinon.stub(emailWithFooter, '_buildFooter').returns(footer));
      it('appends the footer', done => {
        expect(emailWithFooter.renderBody()).to.eventually.contain(footer).notify(done);
      });
      after(() => emailWithFooter._buildFooter.restore());
    });
  });

  describe('#_buildUnsubscribeUrl()', () => {
    it('returns the unsubscribe url for a specific recipient', done => {
      const url = `https://${apiHost}/lists/${emailWithTags.listId}/recipients/${emailWithTags.recipientId}/unsubscribe?cid=${campaignId}`;
      expect(emailWithTags._buildUnsubscribeUrl()).to.equal(url);
      done();
    });
  });

  describe('#renderSubject()', () => {
    context('when the subject contains liquid tags', () => {
      it('returns the subject with parsed liquid tags', (done) => {
        expect(emailWithTags.renderSubject()).to.eventually.equal(subjectParsed).notify(done);
      });
    });
    context('when the subject does not contain liquid tags', () => {
      it('returns the subject unmodified', (done) => {
        expect(emailNoTags.renderSubject()).to.eventually.equal(subjectNoTags).notify(done);
      });
    });
  });
});
