import * as chai from 'chai';
import { respond } from './action';
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { EmailTemplate } from 'moonmail-models';

const expect = chai.expect;

describe('createTemplate', () => {
  const id = 'some-id';
  const userId = 'some-user-id';
  const name = 'my tempalte';
  const body = 'my tempalte body';
  const html = '<h1>Hello</h1>';
  const thumbnail = '797891230qsa09183134';
  const template = { name, body, html, thumbnail, id, userId };
  let event;

  describe('#respond()', () => {
    beforeEach(() => {
      sinon.stub(EmailTemplate, 'save').resolves('ok');
    });

    context('when the event is valid', () => {
      before(() => {
        event = { template };
      });

      it('creates the template', (done) => {
        respond(event, (err, result) => {
          const args = EmailTemplate.save.firstCall.args[0];
          expect(args).to.have.property('userId');
          expect(args).to.have.property('id');
          expect(err).to.not.exist;
          expect(result).to.exist;
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
          expect(EmailTemplate.save).not.to.be.called;
          done();
        });
      });
    });

    afterEach(() => {
      EmailTemplate.save.restore();
    });
  });
});
