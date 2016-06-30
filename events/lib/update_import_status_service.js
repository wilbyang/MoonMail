import { debug } from './index';
import { List } from 'moonmail-models';

class UpdateImportStatusService {

  constructor(importStatusEvent) {
    this.importStatusEvent = importStatusEvent;
    this.userId = this.importStatusEvent.userId;
    this.listId = this.importStatusEvent.listId;
    this.key = this.importStatusEvent.fileName.split('.')[2];
  }

  updateListImportStatus() {
    debug('= UpdateImportStatusService.updateListImportStatus', this.importStatusEvent);
    return List.updateImportStatus(this.userId, this.listId, this.key, this._statusFromEvent());
  }

  _statusFromEvent() {
    return {
      status: this.importStatusEvent.importStatus,
      updatedAt: this.importStatusEvent.updatedAt
    };
  }
}

module.exports.UpdateImportStatusService = UpdateImportStatusService;