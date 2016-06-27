'use strict';

import { debug } from './index';
import * as deep from 'deep-diff';
import { List } from 'moonmail-models';
import { Recipient } from 'moonmail-models';

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
    return new Promise((resolve, reject) => {
      try {
        const aggregatedCounters = this._getIncrements();
        const listIdUserIdMapping = this._getListIdUserIdMapping();
        let operations = [];
        for (let listId in aggregatedCounters) {
          operations.push(List.incrementAll(listId, listIdUserIdMapping[listId], aggregatedCounters[listId]));
        }
        Promise.all(operations)
          .then(() => { resolve({}); })
          .catch((error) => { reject(error); });
      } catch (error) { reject(error); }
    });
  }

  get statusChangesStateMachine() {
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
    }
  }

  _getListIdUserIdMapping() {
    let listIdUserIdMapping = {};
    this.eventDetails.Records.forEach((event) => {
      let image = "NewImage";
      if (event.eventName === "REMOVE") {
        image = "OldImage";
      }
      const listId = event.dynamodb.Keys.listId.S;
      const userId = event.dynamodb[image].userId.S;
      listIdUserIdMapping[listId] = userId;
    });
    return listIdUserIdMapping;
  }

  // total, subscribed, awaiting_confirmation, unsubscribed
  _getIncrements() {
    let statusAttrMapping = {
      subscribed: this.subscribedCountAttr,
      unsubscribed: this.unsubscribedCountAttr,
      awaitingConfirmation: this.awaitingConfirmationCountAttr,
      complained: this.complainedCountAttr,
      bounced: this.bouncedCountAttr
    };

    let aggregatedCounters = {};
    this.eventDetails.Records.map((event) => event.dynamodb.Keys.listId.S).forEach((listId) => {
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

          attribute = this.statusChangesStateMachine[oldStatus][newStatus];
          // Check if the update changed the status attribute
          if (attribute) {
            aggregatedCounters[listId][attribute] += 1; // increment according to the change
            let oldStatusAttr = statusAttrMapping[oldStatus];
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
    });
    return aggregatedCounters;
  }

}

module.exports.RecipientsCounterService = RecipientsCounterService;
