const getAll = function getAllSubscriptions() {
  const subscriptionsString = process.env.EVENT_SUBSCRIPTIONS;
  return Promise.resolve(JSON.parse(subscriptionsString));
};

export default {
  getAll
};
