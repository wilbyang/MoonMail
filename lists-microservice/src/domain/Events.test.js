import '../lib/specHelper';
import Events from './Events';
import RecipientModel from './RecipientModel';

describe('Events', () => {
  describe('.isValid()', () => {
    const validEvents = [
      {
        type: Events.listRecipientImported,
        payload: {
          recipient: {
            email: 'recipient@email.com',
            listId: 'list-id',
            userId: 'user-id',
            metadata: { random: 'data' }
          },
          totalRecipients: 100,
          recipientIndex: 5,
          importId: '1'
        }
      },
      {
        type: Events.listRecipientImported,
        payload: {
          recipient: {
            email: 'recipient@email.com',
            listId: 'list-id',
            userId: 'user-id',
            metadata: { random: 'data' },
            systemMetadata: { countryCode: 'ES' }
          },
          totalRecipients: 100,
          recipientIndex: 5,
          importId: '1'
        }
      },
      {
        type: Events.listRecipientCreated,
        payload: {
          recipient: {
            email: 'recipient@email.com',
            listId: 'list-id',
            userId: 'user-id',
            subscriptionOrigin: RecipientModel.subscriptionOrigins.listImport,
            isConfirmed: true,
            status: RecipientModel.statuses.subscribed,
            metadata: {
              name: 'Carlos'
            }
          }
        }
      },
      {
        type: Events.listRecipientUpdated,
        payload: {
          listId: 'list-id',
          userId: 'user-id',
          id: 'recipient-id',
          data: {
            status: RecipientModel.statuses.subscribed,
            metadata: {
              name: 'Carlos'
            }
          }
        }
      },
      {
        type: Events.listRecipientDeleted,
        payload: {
          listId: 'list-id',
          userId: 'user-id',
          id: 'recipient-id'
        }
      }
    ];
    const invalidEvents = [
      {
        type: Events.listRecipientImported,
        payload: {
          recipient: {
            email: 'recipient@email.com',
            listId: 'list-id'
          }
        }
      },
      {
        type: Events.listRecipientImported,
        payload: {
          recipient: {
            email: 'recipient@email.com',
            listId: 'list-id',
            userId: 'user-id',
            metadata: { random: 'data' },
            systemMetadata: { countryCode: 'NOISO' }
          },
          totalRecipients: 100,
          recipientIndex: 5,
          importId: '1'
        }
      },
      {
        type: Events.listRecipientImported,
        payload: {
          recipient: {
            email: 'recipient@email.com',
            listId: 'list-id',
            userId: 'user-id',
            metadata: { random: 'data' },
            systemMetadata: { noAllowed: 'ES' }
          },
          totalRecipients: 100,
          recipientIndex: 5,
          importId: '1'
        }
      },
      {
        type: Events.listRecipientImported,
        payload: {
          recipient: {
            email: 'wrongemail.com',
            listId: 'list-id',
            userId: 'user-id'
          }
        }
      },
      {
        type: Events.listRecipientCreated,
        payload: {
          recipient: {
            email: 'recipient@email.com',
            listId: 'list-id',
            userId: 'user-id',
            status: RecipientModel.statuses.subscribed,
            isConfirmed: true,
            metadata: {
              'Invalid Key': 2
            }
          }
        }
      },
      {
        type: Events.listRecipientCreated,
        payload: {
          recipient: {
            email: 'recipient@email.com',
            listId: 'list-id',
            userId: 'user-id',
            status: 'invalid-status',
            isConfirmed: true,
            metadata: {
              name: 'Carlos'
            }
          }
        }
      },
      {
        type: Events.listRecipientCreated,
        payload: {
          recipient: {
            email: 'recipient@email.com',
            listId: 'list-id',
            userId: 'user-id',
            status: RecipientModel.statuses.subscribed,
            subscriptionOrigin: 'invalid-subscription-origin',
            isConfirmed: true,
            metadata: {
              name: 'Carlos'
            }
          }
        }
      },
      {
        type: Events.listRecipientUpdated,
        payload: {
          listId: 'list-id',
          id: 'recipient-id',
          data: {
            status: RecipientModel.statuses.subscribed
          }
        }
      },
      {
        type: Events.listRecipientDeleted,
        payload: {
          listId: 'list-id',
          id: 'recipient-id'
        }
      }
    ];

    it('should return true for valid events', () => {
      validEvents.forEach(event => expect(Events.validate(event).error).not.to.exist);
    });

    it('should return false for invalid events', () => {
      invalidEvents.forEach(event => expect(Events.validate(event).error).to.exist);
    });
  });
});
