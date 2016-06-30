'use strict';

import * as chai from 'chai';
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
import * as sinon from 'sinon';
import { List } from 'moonmail-models';
import { UpdateImportStatusService } from './update_import_status_service';
import * as sinonAsPromised from 'sinon-as-promised';
const awsMock = require('aws-sdk-mock');
const AWS = require('aws-sdk');

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('UpdateImportStatusService', () => {
  let updateImportStatusService;
  const updateStatusEvent = { fileName: 'google-oauth2|113373534076241986701.ciq20pw7r000001q6fdm8wb8p.1467208085000.csv', userId: 'user-id', listId: 'list-id', importStatus: 'success', updatedAt: '876876978676' };

  describe('#updateListImportStatus()', () => {
    before(() => {
      updateImportStatusService = new UpdateImportStatusService(updateStatusEvent);
      sinon.stub(List, 'updateImportStatus').resolves('Ok');
    });

    it('updates List import status accordingly', (done) => {
      updateImportStatusService.updateListImportStatus().then(() => {
        expect(List.updateImportStatus).to.have.been.called;
        const updateArgs = List.updateImportStatus.lastCall.args;
        expect(updateArgs[0]).to.equals('user-id');
        expect(updateArgs[1]).to.equals('list-id');
        expect(updateArgs[2]).to.equals('1467208085000');
        expect(updateArgs[3]).to.deep.equals({
          status: 'success',
          updatedAt: '876876978676'
        });

        done();
      });
    });

    after(() => {
      List.updateImportStatus.restore();
    });
  });
});
