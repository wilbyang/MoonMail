import { SimpleStatefulRecursiveService } from 'recursive-lambda';
import MapCsvStringToRecipients from './MapCsvStringToRecipients';
import PublishRecipientsBatch from './PublishRecipientsBatch';
import wait from '../lib/utils/wait';

// FIXME: This mixes bussines logic and application logic
export default class ImportRecipientsCsv extends SimpleStatefulRecursiveService {

  static execute(params, lambdaClient, context) {
    return new ImportRecipientsCsv(params, lambdaClient, context).execute();
  }

  constructor(params, lambdaClient, context) {
    super(params, lambdaClient, context);
    this.processingOffset = params.processingOffset;
    this.userId = params.userId;
    this.listId = params.listId;
    this.body = params.body;
    this.headerMapping = params.headerMapping;
    this.fileName = params.fileName;
    this.s3Event = params.s3Event;
    this.initState({
      processingOffset: this.processingOffset,
      processCompleted: false
    });
  }

  get batchSize() {
    return 200;
  }

  beforeInvokeLambda() {
    const nextCallParams = Object.assign({}, this.s3Event, { processingOffset: this.state.processingOffset });
    this.updateState(nextCallParams, true);
  }

  get executionInvariant() {
    return !this.state.isOperationAborted && !this.state.processCompleted;
  }

  action(state = {}) {
    if (state.processCompleted) return this.completeExecution();
    return this.importRecipients(this.state);
  }

  async importRecipients(state) {
    await wait(500);
    const startIndex = state.processingOffset;
    const lastIndex = startIndex + this.batchSize;
    const recipients = await this.getRecipients();
    const recipientsBatch = recipients.slice(startIndex, lastIndex);
    await PublishRecipientsBatch.execute(recipientsBatch, this.fileName, startIndex, this.batchSize, recipients.length);
    return this.updateState({
      recipients,
      processingOffset: lastIndex,
      processCompleted: recipients.length - 1 <= lastIndex
    });
  }

  getRecipients() {
    if (this.state.recipients) return Promise.resolve(this.state.recipients);
    return MapCsvStringToRecipients.execute({
      csvString: this.body,
      userId: this.userId,
      listId: this.listId,
      headerMapping: this.headerMapping
    });
  }
}

