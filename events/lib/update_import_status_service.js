import { List } from 'moonmail-models';
import { debug } from './index';

class UpdateImportStatusService {
  constructor(importStatusEvent) {
    this.importStatusEvent = importStatusEvent;
    this.userId = this.importStatusEvent.userId;
    this.listId = this.importStatusEvent.listId;
    this.key = this.importStatusEvent.fileName.split('.')[2];
  }

  updateListImportStatus() {
    debug('= UpdateImportStatusService.updateListImportStatus', this.importStatusEvent);
    return List.get(this.userId, this.listId).then((list) => {
      if (!list.importStatus || !list.importStatus[this.key]) {
        return List.createFileImportStatus(this.userId, this.listId, this.key, this._createStatusFromEvent());
      } else {
        return List.updateImportStatus(this.userId, this.listId, this.key, this._updateStatusFromEvent());
      }
    });
  }

  _createStatusFromEvent() {
    return {
      status: this.importStatusEvent.importStatus,
      importing: this.importStatusEvent.importStatus === 'importing',
      createdAt: this.importStatusEvent.createdAt ? this.importStatusEvent.createdAt : this.importStatusEvent.finishedAt
    };
  }

  _updateStatusFromEvent() {
    // update payload is slightly different
    let status = {
      text: this.importStatusEvent.importStatus,
      isImporting: this.importStatusEvent.importStatus === 'importing'
    };

    if (this.importStatusEvent.createdAt) { // this shouldn't happend
      status.dateField = 'createdAt';
      status.dateValue = this.importStatusEvent.createdAt;
    }

    if (this.importStatusEvent.finishedAt) {
      status.dateField = 'finishedAt';
      status.dateValue = this.importStatusEvent.finishedAt;
    }
    return status;
  }
}

module.exports.UpdateImportStatusService = UpdateImportStatusService;
