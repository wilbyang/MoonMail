'use strict';

import * as chai from 'chai';
import { respond } from './action';
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { SentEmail } from 'moonmail-models';
import * as event from './event.json'

const expect = chai.expect;

describe('saveSentEmails', () => {

  describe('#respond()', () => {
    beforeEach(() => {
      sinon.stub(SentEmail, 'saveAll').resolves('ok');
    });

    it('saves all the sent emails', (done) => {
      respond(event, (err, result) => {
        const sentEmails = SentEmail.saveAll.firstCall.args[0];
        for (let sentEmail of sentEmails) {
          expect(sentEmail).to.have.property('messageId');
          expect(sentEmail).to.have.property('listId');
          expect(sentEmail).to.have.property('recipientId');
          expect(sentEmail).to.have.property('campaignId');
          expect(err).to.not.exist;
          expect(result).to.exist;
        }
        done();
      });
    });

    afterEach(() => {
      SentEmail.saveAll.restore();
    });
  });
});
