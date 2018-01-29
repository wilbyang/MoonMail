import sinon from 'sinon';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import 'sinon-as-promised';
import { SendTestEmailService } from '../../lib/services/send_test_email_service';
import { respond } from './action';
import FunctionsClient from '../../lib/functions_client';

const expect = chai.expect;
chai.use(sinonChai);


describe('sendTestEmail', () => {
  const subject = 'my campaign subject';
  const body = 'my campaign body';
  const validCampaign = { subject, body };
  const incompleteCampaign = { subject };
  let event;

  describe('#respond()', () => {

    context('when the campaign has the needed parameters', () => {
      let functionsClientStub;
      let serviceInstanceStub;

      before(() => {
        functionsClientStub = sinon.stub(FunctionsClient, 'execute');
        event = { campaign: validCampaign };
        event.authToken = 'some-token';
        serviceInstanceStub = sinon.createStubInstance(SendTestEmailService);
        serviceInstanceStub.sendEmail.resolves(true);
        sinon.stub(SendTestEmailService, 'create').returns(serviceInstanceStub);
        functionsClientStub.resolves({});
      });
      after(() => {
        SendTestEmailService.create.restore();
        functionsClientStub.restore();
      });

      it('sends the campaign', (done) => {
        respond(event, (err, result) => {
          if (err) return done(err);
          expect(serviceInstanceStub.sendEmail).to.have.been.called;
          expect(SendTestEmailService.create).to.have.been.calledWithMatch(sinon.match.any, Object.assign({}, event.campaign, { sender: {} }));
          expect(result).to.exist;
          done();
        });
      });
    });
    context('and it has custom sender', () => {
      let functionsClientStub;
      let serviceInstanceStub;

      const campaignCustomSender = Object.assign({}, validCampaign, { senderId: 'foo' });
      const emailFrom = 'my-custom@email.com';
      const sender = {
        apiKey: 1, apiSecret: 2, region: 'bar', emailAddress: emailFrom, fromName: 'David'
      };
      before(() => {
        const getSenderFunction = 'get-sender';
        functionsClientStub = sinon.stub(FunctionsClient, 'execute');
        process.env.FETCH_SENDER_FN_NAME = getSenderFunction;
        serviceInstanceStub = sinon.createStubInstance(SendTestEmailService);
        serviceInstanceStub.sendEmail.resolves(true);
        sinon.stub(SendTestEmailService, 'create').returns(serviceInstanceStub);
        functionsClientStub
          .withArgs(getSenderFunction, { userId: sinon.match.any, senderId: 'foo' })
          .resolves(sender)
          .withArgs(sinon.match.any)
          .resolves({});
      });
      after(() => {
        delete process.env.FETCH_SENDER_FN_NAME;
        functionsClientStub.restore();
        SendTestEmailService.create.restore();
      });

      it('should use it', (done) => {
        respond({ campaign: campaignCustomSender }, (err, result) => {
          if (err) return done(err);
          expect(serviceInstanceStub.sendEmail).to.have.been.called;
          const expected = Object.assign({}, campaignCustomSender, { sender });
          expect(SendTestEmailService.create).to.have.been.calledWithMatch(sinon.match.any, expected);
          expect(result).to.exist;
          done();
        });
      });
    });

    context('when the campaign is incomplete', () => {
      let serviceInstanceStub;
      let functionsClientStub;

      before(() => {
        event = { campaign: incompleteCampaign };
        event.authToken = 'some-token';
        functionsClientStub = sinon.stub(FunctionsClient, 'execute');
        serviceInstanceStub = sinon.createStubInstance(SendTestEmailService);
        serviceInstanceStub.sendEmail.rejects(new Error('Params missing'));
        sinon.stub(SendTestEmailService, 'create').returns(serviceInstanceStub);
        functionsClientStub.resolves({});
      });
      after(() => {
        //serviceInstanceStub.sendEmail.restore();
        functionsClientStub.restore();
        SendTestEmailService.create.restore();
      });

      it('sends an error message', (done) => {
        respond(event, (err, data) => {
          const error = JSON.parse(err);
          expect(error).to.have.property('message', 'Params missing');
          expect(err).to.exist;
          done();
        });
      });
    });
  });
});
