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
  const updateStatusEvent = { fileName: 'filename.csv', userId: 'user-id', listId: 'list-id', status: 'SUCCESS', updatedAt: '876876978676' };

  describe('#updateListImportStatus()', () => {
    before(() => {
      updateImportStatusService = new UpdateImportStatusService(updateStatusEvent);
      sinon.stub(List, 'update').resolves('Ok');
    });

    it('updates List import status accordingly', (done) => {
      updateImportStatusService.updateListImportStatus().then(() => {
        expect(List.update).to.have.been.called;
        const updateArgs = List.update.lastCall.args;
        expect(updateArgs[0]).to.deep.equals({
          importStatus: {
            fileName: 'filename.csv',
            status: 'SUCCESS',
            updatedAt: '876876978676'
          }
        });
        expect(updateArgs[1]).to.equals('user-id');
        expect(updateArgs[2]).to.equals('list-id');
        done();
      });
    });

    after(() => {
      List.update.restore();
    });
  });
});
