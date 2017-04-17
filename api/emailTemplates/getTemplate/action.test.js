'use strict';

import * as chai from 'chai';
import { respond } from './action';
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { EmailTemplate } from 'moonmail-models';

const expect = chai.expect;

describe('getTemplate', () => {

  const templateId = 'some-id';
  const template = {
    id: templateId,
    name: 'my template',
    body: 'my template body',
    thumbnail: '324234123018vcvsdv',
    userId: 'user-id'
  };
  let event;

  describe('#respond()', () => {
    beforeEach(() => {
      sinon.stub(EmailTemplate, 'get').resolves(template);
    });

    context('when the event is valid', () => {
      before(() => {
        event = { templateId };
      });

      it('gets the template', (done) => {
        respond(event, (err, result) => {
          const args = EmailTemplate.get.lastCall.args;
          expect(args[1]).to.equal(templateId);
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
      EmailTemplate.get.restore();
    });
  });
});
