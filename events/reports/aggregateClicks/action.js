import { ClickReport } from 'moonmail-models';
import { debug } from '../../lib/index';
import { IncrementAggregatedEventsService } from '../../lib/increment_aggregated_events_service';

export default function respond(event, cb) {
  debug('= aggregateOpens.action', JSON.stringify(event));
  const incrementAggregatedOpensService = IncrementAggregatedEventsService.create(event.Records, ClickReport);
  incrementAggregatedOpensService.incrementAll()
    .then(() => cb(null, true))
    .catch(err => cb(err));
}
