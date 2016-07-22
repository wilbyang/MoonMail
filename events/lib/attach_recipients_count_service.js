import { List } from 'moonmail-models';

class AttachRecipientsCountService {

  static create(campaign, snsClient) {
    return new AttachRecipientsCountService(campaign, snsClient);
  }

  constructor(canonicalMessage, snsClient) {
    this.canonicalMessage = canonicalMessage;
    this.snsClient = snsClient;
  }

  attachCount() {
    return this._getLists()
      .then(lists => this._countRecipients(lists))
      .then(count => this._buildCanonicalMessage(count))
      .then(canonicalMessage => this._publishToSns(canonicalMessage));
  }

  _getLists() {
    const listIds = this.canonicalMessage.campaign.listIds;
    const getListPromises = listIds.map(listId => List.get(this.canonicalMessage.userId, listId));
    return Promise.all(getListPromises);
  }

  _countRecipients(lists) {
    const count = lists.reduce((accum, next) => (accum + next.subscribedCount), 0);
    return count;
  }

  _buildCanonicalMessage(recipientsCount) {
    return Object.assign({}, this.canonicalMessage, {recipientsCount});
  }

  _publishToSns(canonicalMessage) {
    const params = {
      Message: JSON.stringify(canonicalMessage),
      TopicArn: process.env.ATTACH_SENDER_TOPIC_ARN
    };
    return this.snsClient.publish(params).promise()
      .then(() => canonicalMessage);
  }
}

module.exports.AttachRecipientsCountService = AttachRecipientsCountService;
