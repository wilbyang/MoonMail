'use strict';

import * as chai from 'chai';
import { respond } from './action';
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { CleanRecipientsEmailService } from '../../lib/clean_recipients_email_service';
import * as event from './event.json'

const expect = chai.expect;

describe('recipientsCounter', () => {

  describe('#respond()', () => {
    beforeEach(() => {
      sinon.stub(CleanRecipientsEmailService, 'cleanAndUpdate').resolves({});
    });

    it('calls the cleaning service', (done) => {
      respond(event, (err, result) => {
        expect(CleanRecipientsEmailService.cleanAndUpdate).to.be.calledOnce;
        done();
      });
    });

    afterEach(() => {
      CleanRecipientsEmailService.cleanAndUpdate.restore();
    });
  });
});
