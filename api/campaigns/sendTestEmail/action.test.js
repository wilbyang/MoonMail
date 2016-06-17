'use strict';

import * as sinon from 'sinon';
import { SendTestEmailService } from '../../lib/services/send_test_email_service';
import * as chai from 'chai';
import * as sinonAsPromised from 'sinon-as-promised';
import { respond } from './action';
const expect = chai.expect;
let serviceInstanceStub;

describe('sendTestEmail', () => {
  const subject = 'my campaign subject';
  const body = 'my campaign body';
  const validCampaign = {subject, body};
  const incompleteCampaign = {subject};
  let event;

  describe('#respond()', () => {
    context('when the campaign has the needed parameters', () => {
      before(() => {
        event = {campaign: validCampaign};
        event.authToken = 'some-token';
        serviceInstanceStub = sinon.createStubInstance(SendTestEmailService);
        serviceInstanceStub.sendEmail.resolves(true);
        sinon.stub(SendTestEmailService, 'create').returns(serviceInstanceStub);
      });

      it('sends the campaign', (done) => {
        respond(event, (err, result) => {
          expect(serviceInstanceStub.sendEmail).to.have.been.calledOnce;
          expect(err).to.not.exist;
          expect(result).to.exist;
          done();
        });
      });

      after(() => {
        SendTestEmailService.create.restore();
      });
    });

    context('when the campaign is incomplete', () => {
      before(() => {
        event = {campaign: incompleteCampaign};
        event.authToken = 'some-token';
      });

      it('sends an error message', (done) => {
        respond(event, (err) => {
          expect(serviceInstanceStub.sendEmail).not.to.have.been.called;
          const error = JSON.parse(err);
          expect(error).to.have.property('message', 'Params missing');
          expect(err).to.exist;
          done();
        });
      });
    });
  });
});
