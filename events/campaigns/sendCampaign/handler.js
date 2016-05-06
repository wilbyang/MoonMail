import { SendCampaignService } from '../../lib/send_campaign_service';

export default (event, context) => {
  const sendService = new SendCampaignService('ca213');
  sendService.sendCampaign()
    .then((data) => context.done(null, data))
    .catch((err) => context.done(err));
};
