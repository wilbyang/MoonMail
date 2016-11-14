'use strict';

import { Promise } from 'bluebird';
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
  let state = {};
  if (event.hasOwnProperty('QueueUrl')) {
    debug('= sender.sendEmails', 'The queue url was provided', event);
    state = event.state;
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

  handlePauses(state).then((lastPausedOn) => {
    state.lastPausedOn = lastPausedOn;
    const senderService = new SendEmailService(emailQueue, lambda, context, state);
    senderService.sendEnqueuedEmails()
      .then((result) => cb(null, result))
      .catch((err) => cb(err, null));
  });
};

function handlePauses(state) {
  let lastPausedOn = state.lastPausedOn;
  const sentEmails = state.sentEmails;
  debug('= sender._handlePauses called', sentEmails);
  let delay = 0;
  if (sentEmails - lastPausedOn >= 1000) {
    lastPausedOn = sentEmails;
    // Take a 2 mins pause.
    delay = 2 * 60 * 1000;
    debug('= sender._handlePauses', `${sentEmails} emails sent, let's take a break`);
  }
  return Promise.delay(delay, lastPausedOn);
}
module.exports.handlePauses = handlePauses;
