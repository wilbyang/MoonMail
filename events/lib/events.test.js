import { expect } from 'chai';
import Events from './events';

describe('Events', () => {
  describe('.isValid()', () => {
    const validEvents = [
      {
        type: 'list.recipient.subscribe',
        payload: {
          recipient: {
            id: 'recipient-id',
            email: 'recipient@email.com',
            listId: 'list-id',
            userId: 'user-id',
            unknown: 'attribute'
          }
        }
      },
      {
        type: 'campaign.open',
        payload: {
          campaign: {
            id: 'campaign-id',
            userId: 'user-id',
            unknown: 'attribute'
          },
          recipient: {
            id: 'recipient-id',
            listId: 'list-id',
            unknown: 'attribute'
          }
        }
      }
    ];
    const invalidEvents = [
      {
        type: 'list.recipient.subscribe',
        payload: {
          recipient: {
            id: 'recipient-id',
            listId: 'list-id',
            userId: 'user-id'
          }
        }
      },
      {
        type: 'campaign.open',
        payload: {
          campaign: {
            id: 'campaign-id',
            userId: 'user-id'
          }
        }
      },
      {
        type: 'non-supported'
      }
    ];

    it('should return true for valid events', () => {
      validEvents.forEach(event => expect(Events.isValid(event)).to.be.true);
    });

    it('should return false for invalid events', () => {
      invalidEvents.forEach(event => expect(Events.isValid(event)).to.be.false);
    });
  });
});
