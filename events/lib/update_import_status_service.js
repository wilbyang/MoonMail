import { debug } from './index';
import { List } from 'moonmail-models';

class UpdateImportStatusService {

  constructor(importStatusEvent) {
    this.importStatusEvent = importStatusEvent;
    this.userId = this.importStatusEvent.userId;
    this.listId = this.importStatusEvent.listId;
    this.fileName = this.importStatusEvent.fileName;
  }

  updateListImportStatus() {
    debug('= UpdateImportStatusService.updateListImportStatus', this.importStatusEvent);
    return List.updateImportStatus(this.userId, this.listId, this.fileName, this._statusFromEvent());
  }

  _statusFromEvent() {
    return {
      status: this.importStatusEvent.importStatus,
      updatedAt: this.importStatusEvent.updatedAt
    };
  }
}

module.exports.UpdateImportStatusService = UpdateImportStatusService;