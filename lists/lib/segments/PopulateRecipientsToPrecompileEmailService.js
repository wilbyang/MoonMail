import AWS from 'aws-sdk';
import Promise from 'bluebird';
import { SimpleStatefulRecursiveService } from 'recursive-lambda';
import { logger } from '../../lib/index';
import Segments from '../../lib/segments/index';

export default class PopulateRecipientsToPrecompileEmailService extends SimpleStatefulRecursiveService {

  static create(params, lambdaClient, context) {
    return new PopulateRecipientsToPrecompileEmailService(params, lambdaClient, context);
  }

  constructor(params, lambdaClient, context) {
    super(params, lambdaClient, context);
    this.eventMessage = JSON.parse(params.eventMessage);
    this.processingOffset = params.processingOffset;
    this.segmentId = this.eventMessage.campaign.segmentId;

    this.initState({
      processingOffset: this.processingOffset,
      eventMessage: this.eventMessage,
      processCompleted: false
    });
  }

  batchSize() {
    return 100;
  }

  get snsClient() {
    return new AWS.SNS({ region: process.env.SERVERLESS_REGION });
  }

  errorCallback(err) {
    logger().error(err);
  }

  beforeInvokeLambda() {
    this.updateState({
      Records: [{ Sns: { Message: JSON.stringify(this.eventMessage) } }],
      processingOffset: this.state.processingOffset
    }, true);
  }

  action(state = {}) {
    if (state.processCompleted) return this.completeExecution();
    return this.attachRecipients(state);
  }

  get executionInvariant() {
    return !this.state.isOperationAborted && !this.state.processCompleted;
  }

  attachRecipients(state) {
    return this._getRecipientsBatch(state)
      .then(searchResult => this._populateRecipientsBatch(searchResult.items).then(() => searchResult))
      .then(searchResult => this.updateState({
        processingOffset: state.processingOffset + this.batchSize(),
        processCompleted: searchResult.total <= state.processingOffset + this.batchSize()
      }));
  }

  _getRecipientsBatch(state) {
    return Segments.listSubscribedMembers(this.segmentId, { from: state.processingOffset, size: this.batchSize() });
  }

  _populateRecipientsBatch(recipients) {
    return Promise.map(recipients, recipient => this._populateRecipient(recipient), { concurrency: 10 });
  }

  _populateRecipient(recipient) {
    const recipientMessage = Object.assign({}, this.eventMessage, { recipient });
    const params = {
      TopicArn: process.env.PRECOMPILE_EMAIL_TOPIC_ARN,
      Message: JSON.stringify(recipientMessage)
    };
    return this._publishMessage(params);
  }

  _publishMessage(params) {
    return this.snsClient.publish(params).promise();
  }
}
