'use strict';

import * as chai from 'chai';
import { respond } from './action';
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { EmailTemplate } from 'moonmail-models';

const expect = chai.expect;

describe('deleteTemplate', () => {

  const templateId = 'my-template-id';
  let event;

  describe('#respond()', () => {
    beforeEach(() => {
      sinon.stub(EmailTemplate, 'delete').resolves(true);
      event = {templateId};
    });

    it('deletes the template', (done) => {
      respond(event, (err, result) => {
        const args = EmailTemplate.delete.lastCall.args;
        expect(args[1]).to.equal(templateId);
        expect(err).to.not.exist;
        expect(result).to.deep.be.truthy;
        done();
      });
    });

    afterEach(() => {
      EmailTemplate.delete.restore();
    });
  });
});
