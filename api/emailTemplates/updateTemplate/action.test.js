'use strict';

import * as chai from 'chai';
import { respond } from './action';
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { EmailTemplate } from 'moonmail-models';

const expect = chai.expect;

describe('updateTemplate', () => {
  const templateId = 'my-template-id';
  const template = {
    id: 'some-id',
    userId: 'user-id',
    name: 'my template',
    body: 'my template body',
    html: '<h1>Hello</h1>',
    thumbnail: 's23423s432234'
  };
  let event;

  describe('#respond()', () => {
    beforeEach(() => {
      sinon.stub(EmailTemplate, 'update').resolves(template);
    });

    context('when the event is valid', () => {
      before(() => {
        event = { template, templateId };
      });

      it('updates the template', (done) => {
        respond(event, (err, result) => {
          const args = EmailTemplate.update.lastCall.args;
          expect(args[2]).to.equal(templateId);
          expect(err).to.not.exist;
          expect(result).to.deep.equal(template);
          done();
        });
      });
    });

    context('when the event is not valid', () => {
      before(() => {
        event = {};
      });
      it('returns an error message', (done) => {
        respond(event, (err, result) => {
          expect(result).to.not.exist;
          expect(err).to.exist;
          done();
        });
      });
    });

    afterEach(() => {
      EmailTemplate.update.restore();
    });
  });
});
