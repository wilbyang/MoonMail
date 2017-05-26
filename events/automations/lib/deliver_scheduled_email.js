import { SES } from 'aws-sdk';
import { EnqueuedEmail } from '../../lib/enqueued_email';

export default class DeliverScheduledEmail {
  static execute(email) {
    const emailClient = this.initEmailClient(email.sender);
    const enqueuedEmail = this._buildEnqueuedEmail(email);
    return this._deliver(emailClient, enqueuedEmail)
      .then(result => ({email: enqueuedEmail, messageId: result.MessageId}))
      .catch(err => this._handleError(err, enqueuedEmail));
  }

  static _deliver(sesClient, enqueuedEmail) {
    return enqueuedEmail.toSesRawParams()
      .then(sesParams => sesClient.sendRawEmail(sesParams).promise());
  }

  static _buildEnqueuedEmail(email) {
    return new EnqueuedEmail(email);
  }

  static _handleError(err, enqueuedEmail) {
    return {
      email: enqueuedEmail,
      error: err,
      retryable: this._isRetryableError(err)
    };
  }

  static _isRetryableError(error) {
    return error.code && error.code === 'Throttling' && !!error.message.toLowerCase().match('maximum sending rate exceeded');
  }

  static initEmailClient(sender) {
    const config = {
      accessKeyId: sender.apiKey,
      secretAccessKey: sender.apiSecret,
      region: sender.region
    };
    return new SES(config);
  }
}
