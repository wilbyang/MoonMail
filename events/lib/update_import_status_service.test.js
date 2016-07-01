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
  let updateStatusEvent;

  describe('#updateListImportStatus()', () => {
    context('when there is a previous status for the file', () => {
      before(() => {
        updateStatusEvent = { fileName: 'google-oauth2|113373534076241986701.ciq20pw7r000001q6fdm8wb8p.1467208085000.csv', userId: 'user-id', listId: 'list-id', importStatus: 'success', finishedAt: '876876978676' };
        updateImportStatusService = new UpdateImportStatusService(updateStatusEvent);
        sinon.stub(List, 'updateImportStatus').resolves('Ok');
        sinon.stub(List, 'createFileImportStatus').resolves('Ok');
        sinon.stub(List, 'get').resolves({ userId: 'user-id', listId: 'list-id', importStatus: { 1467208085000: {} } });
      });

      it('updates List import status accordingly', (done) => {
        updateImportStatusService.updateListImportStatus().then(() => {
          expect(List.updateImportStatus).to.have.been.called;
          const updateArgs = List.updateImportStatus.lastCall.args;
          expect(updateArgs[0]).to.equals('user-id');
          expect(updateArgs[1]).to.equals('list-id');
          expect(updateArgs[2]).to.equals('1467208085000');
          expect(updateArgs[3]).to.deep.equals({
            text: 'success',
            dateField: 'finishedAt',
            dateValue: '876876978676',
            isImporting: false
          });
          expect(List.createFileImportStatus).to.have.not.been.called;
          done();
        });
      });

      after(() => {
        List.updateImportStatus.restore();
        List.get.restore();
        List.createFileImportStatus.restore();
      });
    });

    context('when there is not a previous status for the file', () => {
      before(() => {
        updateStatusEvent = { fileName: 'google-oauth2|113373534076241986701.ciq20pw7r000001q6fdm8wb8p.1467208085000.csv', userId: 'user-id', listId: 'list-id', importStatus: 'importing', createdAt: '876876978676' };
        updateImportStatusService = new UpdateImportStatusService(updateStatusEvent);
        sinon.stub(List, 'updateImportStatus').resolves('Ok');
        sinon.stub(List, 'createFileImportStatus').resolves('Ok');
        sinon.stub(List, 'get').resolves({ userId: 'user-id', listId: 'list-id', importStatus: {} });
      });

      it('updates List import status accordingly', (done) => {
        updateImportStatusService.updateListImportStatus().then(() => {
          expect(List.createFileImportStatus).to.have.been.called;
          expect(List.updateImportStatus).to.have.not.been.called;
          const updateArgs = List.createFileImportStatus.lastCall.args;
          expect(updateArgs[0]).to.equals('user-id');
          expect(updateArgs[1]).to.equals('list-id');
          expect(updateArgs[2]).to.equals('1467208085000');
          expect(updateArgs[3]).to.deep.equals({
            status: 'importing',
            importing: true,
            createdAt: '876876978676'
          });
          done();
        });
      });

      after(() => {
        List.updateImportStatus.restore();
        List.get.restore();
        List.createFileImportStatus.restore();
      });
    });
  });
});
