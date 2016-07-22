'use strict';

import * as chai from 'chai';
import { AttachRecipientsCountService } from '../../lib/attach_recipients_count_service';
import { respond } from './action';
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import * as event from './event.json';

const expect = chai.expect;
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

describe('attachRecipientsCount', () => {
  describe('#respond()', () => {
    const subscribedCount = 10000;
    const eventPayload = JSON.parse(event.Records[0].Sns.Message);
    const attachCountOutput = Object.assign({}, eventPayload, {recipientsCount: subscribedCount});
    let serviceStub;

    before(() => {
      serviceStub = sinon.createStubInstance(AttachRecipientsCountService);
      serviceStub.attachCount.resolves(attachCountOutput);
      sinon.stub(AttachRecipientsCountService, 'create').returns(serviceStub);
    });

    it('attaches the count to the message', (done) => {
      respond(event, (err, result) => {
        expect(result).to.deep.equal(attachCountOutput);
        expect(AttachRecipientsCountService.create).to.have.been.calledWith(eventPayload);
        done();
      });
    });

    afterEach(() => serviceStub.attachCount.restore());
  });
});
