'use strict';

import * as aws from 'aws-sdk';
import { debug } from '../../lib/index';
import { EmailQueue } from '../../lib/email_queue';
import { SendEmailService } from '../../lib/send_email_service';
import { parse } from 'aws-event-parser';

aws.config.update({region: process.env.SERVERLESS_REGION});
const sqs = new aws.SQS();
const lambda = new aws.Lambda();

module.exports.respond = (event, cb, context) => {
  debug('= sender.sendEmails', JSON.stringify(event));
  let emailQueue;
  if (event.hasOwnProperty('QueueUrl')) {
    debug('= sender.sendEmails', 'The queue url was provided', event);
    emailQueue = new EmailQueue(sqs, {url: event.QueueUrl});
  } else {
    debug('= sender.sendEmails', 'Got an SNS event');
    const snsMessage = parse(event)[0];
    if (snsMessage.hasOwnProperty('QueueName')) {
      debug('= sender.sendEmails', 'The queue name was provided', snsMessage);
      emailQueue = new EmailQueue(sqs, {name: snsMessage.QueueName});
    } else {
      debug('= sender.sendEmails', 'Lambda was invoked by CW alarm');
      const queueName = snsMessage.Trigger.Dimensions[0].value;
      emailQueue = new EmailQueue(sqs, {name: queueName});
    }
  };
  const senderService = new SendEmailService(emailQueue, lambda, context);
  senderService.sendEnqueuedEmails()
    .then((result) => cb(null, result))
    .catch((err) => cb(err, null));
};
