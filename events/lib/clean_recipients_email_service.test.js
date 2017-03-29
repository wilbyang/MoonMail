import * as chai from 'chai';
const sinonChai = require('sinon-chai');
const expect = chai.expect;
import * as sinon from 'sinon';
import { CleanRecipientsEmailService } from './clean_recipients_email_service';
import { Recipient } from 'moonmail-models';
import nock from 'nock';

chai.use(sinonChai);

describe('CleanRecipientsEmailService', () => {
  const recipients = [{id: 1, email: 'email@domain.com'}, {id: 2, email: 'email2@domain.com'}, {id: 3 }];
  const cleaningApi = nock('https://whg495mmc3.execute-api.eu-west-1.amazonaws.com/production');
  describe('#cleanAndUpdate()', () => {
    before(() => {
      process.env.CLEAN_EMAILS_ENDPOINT = 'https://whg495mmc3.execute-api.eu-west-1.amazonaws.com/production/emails/validate';
      sinon.stub(Recipient, 'update').resolves({});
      cleaningApi.post('/emails/validate')
        .reply(200, {
          result: [{
            id: 1,
            email: 'email@domain.com',
            success: true,
            code: 'INVALID'
          }, {
            id: 2,
            email: 'email2@domain.com',
            success: true,
            code: 'VALID'
          }]
        });
    });
    it('validate each email and updates accordingly', async () => {
      const result = await CleanRecipientsEmailService.cleanAndUpdate(recipients);
      expect(Recipient.update).to.be.calledOnce;
    });

    after(() => {
      Recipient.update.restore();
      nock.cleanAll();
    });
  });
});
