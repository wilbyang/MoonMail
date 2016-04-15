'use strict';

import * as aws from 'aws-sdk';
import { debug } from '../../lib/index';
import { PrecompileEmailService } from '../../lib/precompile_email_service';

aws.config.update({region: 'us-east-1'});
const sqs = new aws.SQS();

module.exports.respond = (event, cb) => {
  debug('= sender.precompileEmail', JSON.stringify(event));
  const emailParams = JSON.parse(event.Records[0].Sns.Message);
  const precompileService = new PrecompileEmailService(sqs, emailParams);
  precompileService.enqueueEmail()
    .then((result) => cb(null, result))
    .catch(cb);
};
