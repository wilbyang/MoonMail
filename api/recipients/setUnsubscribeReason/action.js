import moment from 'moment';
import { Report, Recipient, List } from 'moonmail-models';
import { debug } from '../../lib/logger';
import { ApiErrors } from '../../lib/errors';

export function respond(event, cb) {
  debug('= setUnsubscribeReason.action', JSON.stringify(event));
  if (event.listId && event.recipientId && event.requestBody.reason && event.campaignId) {
    setUnsubscribeReason(event.recipientId, event.listId, event.campaignId, event.requestBody.reason)
      .then((recipient) => {
        debug('= setUnsubscribeReason.action', 'Success');
        return cb(null, { success: true });
      }).catch((e) => {
        debug('= setUnsubscribeReason.action', e);
        return cb(ApiErrors.response(e));
      });
  } else {
    return cb(ApiErrors.response('Missing required params'));
  }
}

function setUnsubscribeReason(recipientId, listId, campaignId, reason) {
  return Recipient.update({ unsubscribeReason: reason }, listId, recipientId)
    .then(recipient => publishComplaintIfApplies(recipient, listId, campaignId, reason));
}

function publishComplaintIfApplies(recipient, listId, campaignId, reason) {
  if (reason !== 'complaint') return Promise.resolve(recipient);

  // Email notifications service has too many responsibilities and it doesn't fit 
  // this use case, so we are relying directly on the Report model to notify the
  // complaints.
  const updatedRecpt = { status: Recipient.statuses.complaint };
  updatedRecpt[`${updatedRecpt.status}At`] = moment().unix();
  return Recipient.update(updatedRecpt, listId, recipient.id)
    .then(recipient => List.increment('complainedCount', 1, recipient.userId, listId))
    .then(() => Report.incrementComplaints(campaignId))
    .then(() => recipient);
}
