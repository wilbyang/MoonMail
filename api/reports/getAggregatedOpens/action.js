import { OpenReport } from 'moonmail-models';
import GetTimeSeriesDataService from '../lib/get_time_series_data_service';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import { ApiErrors } from '../../lib/errors';

export function respond(event, cb) {
  debug('= getAggregatedOpens.action', JSON.stringify(event));
  decrypt(event.authToken).then(async () => {
    if (event.start && event.campaignId) {
      try {
        const report = await GetTimeSeriesDataService.run(OpenReport, event.campaignId, event.start, event.end);
        return cb(null, report);
      } catch (err) {
        debug('= getAggregatedOpens.action', 'Error getting opens report', err);
        return cb(ApiErrors.response(err));
      }
    } else {
      return cb(ApiErrors.response('Missing params'));
    }
  })
  .catch(err => cb(ApiErrors.response(err), null));
}
