'use strict';

import { debug } from './index';
import * as Liquid from 'liquid-node';

const liquid = new Liquid.Engine();

class Email {
  constructor({ fromEmail, to, body, subject, metadata } = {}) {
    this.from = fromEmail;
    this.to = to;
    this.body = body;
    this.subject = subject;
    this.metadata = metadata;
  }

  renderBody() {
    debug('= Email.renderBody', 'Rendering body with template', this.body, 'and metadata', this.metadata);
    return liquid.parseAndRender(this.body, this.metadata);
  }

  renderSubject() {
    debug('= Email.renderSubject', 'Rendering subject with template', this.subject, 'and metadata', this.metadata);
    return liquid.parseAndRender(this.subject, this.metadata);
  }

  _appendOpensTracking() {
    if (this.opensTrackUrl) {
      const imgTag = `<img src="${this.opensTrackUrl}" width="1" height="1" />`;
      return `${this.body} ${imgTag}`;
    } else {
      return this.body;
    }
  }

}

module.exports.Email = Email;
