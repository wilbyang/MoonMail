import AWS from 'aws-sdk';
import { logger } from '../../lib/index';
import PopulateRecipientsToPrecompileEmailService from '../../lib/segments/PopulateRecipientsToPrecompileEmailService';

export default function respond(event, context, cb) {
  logger().info('= attachSegmentRecipients.action', JSON.stringify(event));

  const params = {
    eventMessage: event.Records[0].Sns.Message,
    processingOffset: event.processingOffset || 0
  };

  const service = PopulateRecipientsToPrecompileEmailService.create(params, new AWS.Lambda({ region: process.env.SERVERLESS_REGION }), context);
  service.execute()
    .then(status => cb(null, status))
    .catch((err) => {
      logger().error(err);
      return cb(err);
    });
}
