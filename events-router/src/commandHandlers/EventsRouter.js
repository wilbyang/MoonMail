import R from 'ramda';
import Promise from 'bluebird';
import SubscriptionRepo from '../repositories/Subscription';
import KinesisNotifier from '../notifiers/KinesisNotifier';
import Event from '../domain/Event';
import EventsDeadLetterQueue from '../lib/EventsDeadLetterQueue';

const byType = R.groupBy(R.prop('type'));
const streamEventsByType = R.pipe(
  R.map(Event.deserializeKinesisEvent),
  R.filter(Event.isValid),
  byType
);
const buildEventsSubscriptionPairs = function buildEventsSubscriptionPairs(subscriptions, kinesisRecords = []) {
  const eventsByType = streamEventsByType(kinesisRecords);
  return subscriptions.reduce((total, s) => {
    const events = eventsByType[s.type];
    return events ? total.concat([[events, s]]) : total;
  }, []);
};
const publishEventsSubscriptionPairs = function publishEventsSubscriptionPairs(eventSubscriptionPairs) {
  return Promise.map(eventSubscriptionPairs, pair => KinesisNotifier.publishBatch(...pair));
};
const execute = function routeKinesisEvents(kinesisStream) {
  return SubscriptionRepo.getAll()
    .then(subscriptions => buildEventsSubscriptionPairs(subscriptions, kinesisStream.Records))
    .then(eventSubscriptionPairs => publishEventsSubscriptionPairs(eventSubscriptionPairs))
    .then(results => R.chain(R.prop('records'), results))
    .then(chainedResults => R.filter(R.has('error'), chainedResults))
    .then(erroredResults => Promise.map(erroredResults, evt => EventsDeadLetterQueue.put(evt)));
};

export default {
  execute
};
