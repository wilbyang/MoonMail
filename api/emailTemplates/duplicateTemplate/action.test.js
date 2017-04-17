'use strict';

import * as chai from 'chai';
import { respond } from './action';
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { EmailTemplate } from 'moonmail-models';

const expect = chai.expect;

describe('duplicateTemplate', () => {

  const senderId = 'ca654';
  const subject = 'my template subject';
  const listIds = ['ca43546'];
  const name = 'my template';
  const body = 'my template body';
  const templateId = 'template-id';
  const thumbnail = '2342dsjhkvhsk2397';

  const template = { id: templateId, name, body, thumbnail };
  let event;

  describe('#respond()', () => {
    beforeEach(() => {
      sinon.stub(EmailTemplate, 'save').resolves('ok');
    });

    context('when the event is valid', () => {
      before(() => {
        event = { templateId };
        sinon.stub(EmailTemplate, 'get').resolves(Object.assign({ userId: 'user-id', id: templateId }, template));
      });

      it('duplicates the template', (done) => {
        respond(event, (err, result) => {
          expect(EmailTemplate.get).to.have.been.called;
          expect(EmailTemplate.get.lastCall.args).to.deep.equals(['my-user-id', 'template-id']);
          const args = EmailTemplate.save.lastCall.args[0];
          expect(args).to.have.property('userId');
          expect(args).to.have.property('id');
          expect(args).to.have.property('body', template.body);
          expect(args).to.have.property('thumbnail', template.thumbnail);
          expect(args).to.have.property('name', `${name} copy`);
          expect(err).to.not.exist;
          expect(result).to.exist;
          done();
        });
      });

      after(() => {
        EmailTemplate.get.restore();
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

    context('when the template does not exists', () => {
      before(() => {
        event = { templateId: 'non-existing' };
        sinon.stub(EmailTemplate, 'get').rejects('template not found');
      });

      it('returns an error message', (done) => {
        respond(event, (err, result) => {
          expect(EmailTemplate.save).to.have.been.not.called;
          expect(result).to.not.exist;
          expect(err).to.exist;
          done();
        });
      });

      after(() => {
        EmailTemplate.get.restore();
      });
    });

    afterEach(() => {
      EmailTemplate.save.restore();
    });
  });
});
