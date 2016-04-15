'use strict';

import * as chai from 'chai';
const chaiAsPromised = require('chai-as-promised');
import { expect } from 'chai';
import { Email } from './email';

chai.use(chaiAsPromised);

describe('Email', () => {
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
  const emailWithTagsParams = Object.assign({body: bodyTemplate, subject: subjectTemplate}, emailParams);
  const emailNoTagsParams = Object.assign({body: bodyNoTags, subject: subjectNoTags}, emailParams);
  const emailWithTags = new Email(emailWithTagsParams);
  const emailNoTags = new Email(emailNoTagsParams);

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
