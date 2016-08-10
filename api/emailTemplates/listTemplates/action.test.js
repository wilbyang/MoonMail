'use strict';

import * as chai from 'chai';
import { respond } from './action';
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { EmailTemplate } from 'moonmail-models';

const expect = chai.expect;

describe('listTemplates', () => {
  let event;

  describe('#respond()', () => {
    beforeEach(() => {
      sinon.stub(EmailTemplate, 'allBy').resolves({
        Items: [
          {
            id: 'some-id',
            userId: 'some-user-id',
            name: 'my template',
            body: 'my template body',
            thumbnail: '234962347896213784sfsgfs'
          }
        ]
      });
    });

    before(() => {
      event = {};
    });

    it('gets a list of email templates', (done) => {
      respond(event, (err, result) => {
        const args = EmailTemplate.allBy.lastCall.args;
        expect(args[0]).to.equal('userId');
        expect(err).to.not.exist;
        expect(result).to.exist;
        done();
      });
    });

    context('when the event contains page', () => {
      it('makes a paginated query', (done) => {
        const page = 'aaabbbb';
        event.options = { page };
        respond(event, (err) => {
          const allbyArgs = EmailTemplate.allBy.lastCall.args;
          expect(allbyArgs[2]).to.have.property('page', page);
          done();
        });
      });
    });

    afterEach(() => {
      EmailTemplate.allBy.restore();
    });
  });
});
