import Promise from 'bluebird';
import { Recipient, List } from 'moonmail-models';
import { debug } from './index';
class RecipientsCounterService {

  static create(event) {
    return new RecipientsCounterService(event);
  }

  constructor(eventDetails) {
    this.eventDetails = eventDetails;
    this.totalAttribute = 'total';
    this.subscribedCountAttr = 'subscribedCount';
    this.awaitingConfirmationCountAttr = 'awaitingConfirmationCount';
    this.unsubscribedCountAttr = 'unsubscribedCount';
    this.bouncedCountAttr = 'bouncedCount';
    this.complainedCountAttr = 'complainedCount';
  }

  updateCounters() {
    debug('= RecipientsCounterService.getIncrements', this.eventDetails);

    const aggregatedCounters = this._getIncrements();
    const listIdUserIdMapping = this._getListIdUserIdMapping();
    return Promise.map(Object.keys(aggregatedCounters), (listId) => {
      if (!listIdUserIdMapping[listId]) return true;
      return List.incrementAll(listIdUserIdMapping[listId], listId, aggregatedCounters[listId]);
    }, { concurrency: 5 });
  }

  get statusUpdatesMapping() {
    return {
      subscribed: {
        unsubscribed: this.unsubscribedCountAttr,
        complained: this.complainedCountAttr,
        bounced: this.bouncedCountAttr
      },
      unsubscribed: {
        subscribed: this.subscribedCountAttr
      },
      awaitingConfirmation: {
        unsubscribed: this.unsubscribedCountAttr,
        subscribed: this.subscribedCountAttr,
        complained: this.complainedCountAttr,
        bounced: this.bouncedCountAttr
      }
    };
  }

  statusChangesStateMachine(oldStatus, newStatus) {
    try {
      return this.statusUpdatesMapping[oldStatus][newStatus];
    } catch (e) {
      return null;
    }
  }

  _getListIdUserIdMapping() {
    const listIdUserIdMapping = {};
    this.eventDetails.Records.forEach((event) => {
      let image = 'NewImage';
      if (event.eventName === 'REMOVE') {
        image = 'OldImage';
      }
      try {
        const listId = event.dynamodb.Keys.listId.S;
        const userId = event.dynamodb[image].userId.S;
        listIdUserIdMapping[listId] = userId;
      } catch (e) { debug('= RecipientsCounterService._getListIdUserIdMapping', 'Attributes missing', e); }
    });
    return listIdUserIdMapping;
  }

  // total, subscribed, awaiting_confirmation, unsubscribed
  _getIncrements() {
    const statusAttrMapping = {
      subscribed: this.subscribedCountAttr,
      unsubscribed: this.unsubscribedCountAttr,
      awaitingConfirmation: this.awaitingConfirmationCountAttr,
      complained: this.complainedCountAttr,
      bounced: this.bouncedCountAttr
    };

    const aggregatedCounters = {};
    this.eventDetails.Records.map(event => event.dynamodb.Keys.listId.S).forEach((listId) => {
      aggregatedCounters[listId] = {
        total: 0,
        bouncedCount: 0,
        complainedCount: 0,
        subscribedCount: 0,
        awaitingConfirmationCount: 0,
        unsubscribedCount: 0
      };
    });

    this.eventDetails.Records.forEach((event) => {
      try {
        let attribute;
        const listId = event.dynamodb.Keys.listId.S;
        switch (event.eventName) {
          case 'INSERT':
            attribute = statusAttrMapping[event.dynamodb.NewImage.status.S];
            aggregatedCounters[listId][attribute] += 1;
            aggregatedCounters[listId].total += 1;
            break;
          case 'MODIFY':
            const oldStatus = event.dynamodb.OldImage.status.S;
            const newStatus = event.dynamodb.NewImage.status.S;

            attribute = this.statusChangesStateMachine(oldStatus, newStatus);
            // Check if the update changed the status attribute
            if (attribute) {
              aggregatedCounters[listId][attribute] += 1; // increment according to the change
              const oldStatusAttr = statusAttrMapping[oldStatus];
              aggregatedCounters[listId][oldStatusAttr] -= 1; // decrement old status attribute
            }

            break;
          case 'REMOVE':
            attribute = statusAttrMapping[event.dynamodb.OldImage.status.S];
            aggregatedCounters[listId][attribute] -= 1;
            aggregatedCounters[listId].total -= 1;
            break;
          default:
          //
        }
      } catch (error) {
        console.error(error, JSON.stringify(event));
        // do nothing
      }
    });
    return aggregatedCounters;
  }

}

module.exports.RecipientsCounterService = RecipientsCounterService;
