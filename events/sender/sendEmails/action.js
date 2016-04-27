'use strict';

import * as aws from 'aws-sdk';
import { debug } from '../../lib/index';
import { EmailQueue } from '../../lib/email_queue';
import { SendEmailService } from '../../lib/send_email_service';

aws.config.update({region: 'us-east-1'});
const sqs = new aws.SQS();
const lambda = new aws.Lambda();

module.exports.respond = (event, cb, context) => {
  debug('= sender.sendEmails', event);
  let emailQueue;
  if (event.hasOwnProperty('QueueUrl')) {
    debug('= sender.sendEmails', 'The queue url was provided', event);
    emailQueue = new EmailQueue(sqs, {url: event.QueueUrl});
  } else {
    debug('= sender.sendEmails', 'Lambda was invoked by CW alarm');
    const alarm = JSON.parse(event.Records[0].Sns.Message);
    const queueName = alarm.Trigger.Dimensions[0].value;
    emailQueue = new EmailQueue(sqs, {name: queueName});
  }
  const senderService = new SendEmailService(emailQueue, lambda, context.functionName);
  senderService.sendEnqueuedEmails()
    .then((result) => cb(null, result))
    .catch((err) => cb(err, null));
};
