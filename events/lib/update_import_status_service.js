import { debug } from './index';
import { List } from 'moonmail-models';

class UpdateImportStatusService {

  constructor(importStatusEvent) {
    this.importStatusEvent = importStatusEvent;
    this.userId = this.importStatusEvent.userId;
    this.listId = this.importStatusEvent.listId;
  }

  updateListImportStatus() {
    debug('= UpdateImportStatusService.updateListImportStatus', this.importStatusEvent);
    return List.update({ importStatus: this._statusFromEvent() }, this.userId, this.listId);
  }

  _statusFromEvent() {
    return {
      fileName: this.importStatusEvent.fileName,
      status: this.importStatusEvent.importStatus,
      updatedAt: this.importStatusEvent.updatedAt
    };
  }
}

module.exports.UpdateImportStatusService = UpdateImportStatusService;