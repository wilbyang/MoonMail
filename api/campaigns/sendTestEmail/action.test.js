import sinon from 'sinon';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import 'sinon-as-promised';
import { SendTestEmailService } from '../../lib/services/send_test_email_service';
import { respond } from './action';
import FunctionsClient from '../../lib/functions_client';

const expect = chai.expect;
chai.use(sinonChai);
let serviceInstanceStub;

describe('sendTestEmail', () => {
  const subject = 'my campaign subject';
  const body = 'my campaign body';
  const validCampaign = { subject, body };
  const incompleteCampaign = { subject };
  let event;

  describe('#respond()', () => {
    context('when the campaign has the needed parameters', () => {
      beforeEach(() => {
        event = { campaign: validCampaign };
        event.authToken = 'some-token';
        serviceInstanceStub = sinon.createStubInstance(SendTestEmailService);
        serviceInstanceStub.sendEmail.resolves(true);
        sinon.stub(SendTestEmailService, 'create').returns(serviceInstanceStub);
      });
      afterEach(() => {
        SendTestEmailService.create.restore();
      });

      it('sends the campaign', (done) => {
        sinon.stub(FunctionsClient, 'execute').resolves({});
        respond(event, (err, result) => {
          expect(serviceInstanceStub.sendEmail).to.have.been.called;
          expect(SendTestEmailService.create).to.have.been.calledWithMatch(sinon.match.any, Object.assign({}, event.campaign, { sender: {} }));
          expect(err).to.not.exist;
          expect(result).to.exist;
          done();
        });
        FunctionsClient.execute.restore();
      });

      context('and it has custom sender', () => {
        const campaignCustomSender = Object.assign({}, validCampaign, { senderId: 'foo' });
        const emailFrom = 'my-custom@email.com';
        const sender = {
          apiKey: 1, apiSecret: 2, region: 'bar', emailAddress: emailFrom, fromName: 'David'
        };
        before(() => {
          const getSenderFunction = 'get-sender';
          process.env.FETCH_SENDER_FN_NAME = getSenderFunction;
          sinon.stub(FunctionsClient, 'execute')
            .withArgs(getSenderFunction, { userId: sinon.match.any, senderId: 'foo' })
            .resolves(sender)
            .withArgs(sinon.match.any)
            .resolves({});
        });
        after(() => {
          delete process.env.FETCH_SENDER_FN_NAME;
          FunctionsClient.execute.restore();
        });

        it('should use it', (done) => {
          respond({ campaign: campaignCustomSender }, (err, result) => {
            expect(serviceInstanceStub.sendEmail).to.have.been.called;
            const expected = Object.assign({}, campaignCustomSender, { sender });
            expect(SendTestEmailService.create).to.have.been.calledWithMatch(sinon.match.any, expected);
            expect(err).to.not.exist;
            expect(result).to.exist;
            done();
          });
        });
      });
    });

    context('when the campaign is incomplete', () => {
      before(() => {
        event = { campaign: incompleteCampaign };
        event.authToken = 'some-token';
      });

      it('sends an error message', (done) => {
        serviceInstanceStub.sendEmail.reset();
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
