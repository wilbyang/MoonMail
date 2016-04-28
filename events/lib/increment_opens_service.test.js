'use strict';

import * as chai from 'chai';
const chaiAsPromised = require('chai-as-promised');
import { expect } from 'chai';
import * as sinon from 'sinon';
import { IncrementOpensService } from './increment_opens_service';
import * as event from './increment_opens_event.json';

chai.use(chaiAsPromised);

describe('IncrementOpensService', () => {
  let opensService;

  before(() => {
    opensService = new IncrementOpensService(event.Records);
  });

  describe('#opensByCampaign()', () => {
    it('returns the count of opens by campaign', (done) => {
      expect(opensService.opensByCampaign).to.have.property('1234', 2);
      expect(opensService.opensByCampaign).to.have.property('0987', 1);
      done();
    });
  });
});
