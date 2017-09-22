import { parse } from 'aws-event-parser';
import moment from 'moment';
import { Report } from 'moonmail-models';
import { debug } from '../../lib/index';

export function respond(event, cb) {
  debug('= initReport.action', JSON.stringify(event));
  const campaign = parse(event)[0];
  const params = {status: campaign.status};
  return campaign.status === 'sent'
    ? cb(null, true)
    : Report.update({userId: campaign.userId}, campaign.campaignId)
        .then(data => cb(null, data))
        .catch(err => cb(err));
}
