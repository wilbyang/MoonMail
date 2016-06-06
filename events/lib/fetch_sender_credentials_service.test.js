'use strict';

import * as chai from 'chai';
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');
import { expect } from 'chai';
import * as sinon from 'sinon';
import { FetchSenderCredentialsService } from './fetch_sender_credentials_service';
import { Sender } from 'moonmail-models';
require('sinon-as-promised');

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('FetchSenderCredentialsService', () => {
  let fetchSenderCredentialsService;
  const userId = 'user-id';
  const email = 'some@email.com';
  const id = new Buffer(email).toString('base64');

  const apiKey = 'some-api-key';
  const apiSecret = 'some-secret';
  const region = 'some-region';
  const rateLimit = 'some-rate-limit';
  const sendingQuota = 'some-sending-quota';

  describe('#getCredentials()', () => {
    context('when the user uses a free plan', () => {
      before(() => {
        const plan = 'free';

        process.env.DEFAULT_API_KEY = 'default-api-key';
        process.env.DEFAULT_API_SECRET = 'some-secret';
        process.env.DEFAULT_REGION = 'default-region';

        fetchSenderCredentialsService = new FetchSenderCredentialsService(userId, email, plan);
      });

      it('retrieves the default credentials', (done) => {
        fetchSenderCredentialsService.getCredentials().then((credentials) => {
          expect(credentials).to.deep.equal({
            apiKey: process.env.DEFAULT_API_KEY,
            apiSecret: process.env.DEFAULT_API_SECRET,
            region: process.env.DEFAULT_REGION
          });
          done();
        })
        .catch(err => done(err));
      });
    });

    context('when the user uses a paid plan', () => {
      before(() => {
        const plan = 'paid';
        fetchSenderCredentialsService = new FetchSenderCredentialsService(userId, email, plan);
        const senderRecord = {
          userId,
          id,
          apiKey,
          apiSecret,
          region,
          rateLimit,
          sendingQuota,
          email
        };
        sinon.stub(Sender, 'get').resolves(senderRecord);
      });

      it('retrieves the respective user credentials', (done) => {
        fetchSenderCredentialsService.getCredentials().then((credentials) => {
          expect(credentials).to.deep.equal({
            apiKey,
            apiSecret,
            region
          });
          done();
        })
        .catch(err => done(err));
      });
    });
  });
});
