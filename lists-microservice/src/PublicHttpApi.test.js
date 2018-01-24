import './lib/specHelper';
import Api from './Api';
import PublicHttpApi from './PublicHttpApi';
import UserContext from './lib/UserContext';

describe('PublicHttpApi', () => {
  const apiKey = 'the-api-key';
  const user = { id: 'user-id', apiKey };
  const lists = { userId: user.id, items: [1, 2, 3] };

  beforeEach(() => {
    sinon.stub(UserContext, 'byApiKey')
      .withArgs(apiKey).resolves(user);
  });
  afterEach(() => {
    UserContext.byApiKey.restore();
  });

  describe('#getAllLists', () => {
    beforeEach(() => {
      sinon.stub(Api, 'getAllLists')
        .withArgs(user.id).resolves(lists);
    });
    afterEach(() => {
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
});
