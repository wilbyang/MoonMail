import './lib/specHelper';
import Api from './Api';
import PublicHttpApi from './PublicHttpApi';
import UserContext from './lib/UserContext';
import RecipientModel from './domain/RecipientModel';

describe('PublicHttpApi', () => {
  const apiKey = 'the-api-key';
  const user = { id: 'user-id', apiKey };
  const userId = user.id;
  const lists = { userId: user.id, items: [1, 2, 3] };
  const listId = 'some-list-id';
  const createRecipientPayload = { email: 'test@example.com' };
  const searchRecipientsParams = { q: 'some-query', status: 'some-status' };

  describe('#getAllLists', () => {
    beforeEach(() => {
      sinon.stub(UserContext, 'byApiKey')
        .withArgs(apiKey).resolves(user);
      sinon.stub(Api, 'getAllLists')
        .withArgs(user.id).resolves(lists);
    });
    afterEach(() => {
      UserContext.byApiKey.restore();
      Api.getAllLists.restore();
    });

    it('should return all the lists of a given user', (done) => {
      const event = { requestContext: { identity: { apiKey } } };
      PublicHttpApi.getAllLists(event, {}, (err, actual) => {
        expect(err).to.not.exist;
        const expected = { statusCode: 200, body: JSON.stringify({ items: lists.items }) };
        expect(actual).to.include(expected);
        done();
      });
    });
  });

  describe('#createRecipient', () => {
    beforeEach(() => {
      sinon.stub(UserContext, 'byApiKey')
        .withArgs(apiKey).resolves(user);
      sinon.stub(Api, 'publishRecipientCreatedEvent')
        .withArgs({ listId, userId, createRecipientPayload, subscriptionOrigin: RecipientModel.subscriptionOrigins.api })
        .resolves({});
    });
    afterEach(() => {
      UserContext.byApiKey.restore();
      Api.publishRecipientCreatedEvent.restore();
    });

    it('publishes the create recipient event', (done) => {
      const event = { requestContext: { identity: { apiKey } }, body: JSON.stringify({ recipient: createRecipientPayload }), pathParameters: { listId } };
      PublicHttpApi.createRecipient(event, {}, (err, actual) => {
        expect(err).to.not.exist;
        const expected = { statusCode: 202, body: JSON.stringify({ recipient: { id: RecipientModel.buildId(createRecipientPayload) } }) };
        expect(actual).to.include(expected);
        done();
      });
    });
  });

  describe('#listRecipients', () => {
    beforeEach(() => {
      sinon.stub(UserContext, 'byApiKey')
        .withArgs(apiKey).resolves(user);
      sinon.stub(Api, 'searchRecipients')
        .withArgs(Object.assign({}, searchRecipientsParams, { from: 0, size: 10 }, { listId }))
        .resolves({ items: [] });
    });
    afterEach(() => {
      UserContext.byApiKey.restore();
      Api.searchRecipients.restore();
    });

    it('searchs applying the filters', (done) => {
      const event = { requestContext: { identity: { apiKey } }, pathParameters: { listId }, queryStringParameters: searchRecipientsParams };
      PublicHttpApi.listRecipients(event, {}, (err, actual) => {
        expect(err).to.not.exist;
        const expected = { statusCode: 200, body: JSON.stringify({ items: [] }) };
        expect(actual).to.include(expected);
        done();
      });
    });
  });
});
