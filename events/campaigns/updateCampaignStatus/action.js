import { parse } from 'aws-event-parser';
import moment from 'moment';
import { Campaign } from 'moonmail-models';
import { debug } from '../../lib/index';
import UserNotifier from '../../lib/user_notifier';

export function respond(event, cb) {
  debug('= updateCampaignStatus.action', JSON.stringify(event));
  const campaign = parse(event)[0];
  const params = {status: campaign.status};
  if (params.status === 'sent') {
    params.sentAt = moment().unix();
  }
  return Campaign.update(params, campaign.userId, campaign.campaignId)
    .then(updatedCampaign => notifyUser(updatedCampaign))
    .then(data => cb(null, data))
    .catch(err => cb(err));
}

function notifyUser(updatedCampaign) {
  const payload = ['userId', 'status', 'id', 'sentAt'].reduce((accum, key) => {
    accum[key] = updatedCampaign[key];
    return accum;
  }, {});
  return UserNotifier.notify(payload.userId, {type: 'CAMPAIGN_UPDATED', data: payload});
}
