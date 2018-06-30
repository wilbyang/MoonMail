import omitEmpty from 'omit-empty';
import base64url from 'base64-url';
import * as Liquid from 'liquid-node';
import * as url from 'url';
import { debug } from './index';
import { List } from 'moonmail-models'

const liquid = new Liquid.Engine();

class Email {
  constructor({ fromEmail, to, body, subject, metadata, recipientId, listId, campaignId, userId } = {}, options = { footer: true }) {
    this.from = fromEmail;
    this.to = to;
    this.body = body;
    this.subject = subject;
    this.metadata = metadata;
    this.listId = listId;
    this.userId = userId
    this.recipientId = recipientId;
    this.campaignId = campaignId;
    this.apiHost = process.env.API_HOST;
    this.unsubscribeApiHost = process.env.UNSUBSCRIBE_API_HOST;
    this.options = options;
    this.opensPath = 'links/open';
  }

  async renderBody() {
    debug('= Email.renderBody', 'Rendering body with template', this.body, 'and metadata', this.metadata);
    const unsubscribeUrl = this._buildUnsubscribeUrl();
    const resubscribeUrl = await this._buildReSubscribeUrl();
    const extraFields = { recipient_email: this.to, from_email: this.from, unsubscribe_url: unsubscribeUrl, resubscribe_url: resubscribeUrl };
    const metadata = Object.assign({}, this.metadata, extraFields);
    return liquid.parseAndRender(this.body, metadata)
      .then(parsedBody => {
        return this._appendFooter(parsedBody)
      });
  }

  renderSubject() {
    debug('= Email.renderSubject', 'Rendering subject with template', this.subject, 'and metadata', this.metadata);
    return liquid.parseAndRender(this.subject, this.metadata);
  }

  get unsubscribeUrl() {
    return this._buildUnsubscribeUrl();
  }

  appendOpensPixel(body) {
    return new Promise((resolve) => {
      if (this.opensTrackUrl) {
        const imgTag = `<img src="${this.opensTrackUrl}" width="1" height="1" />`;
        resolve(`${body} ${imgTag}`);
      } else {
        return resolve(body);
      }
    });
  }

  get opensTrackUrl() {
    if (this.apiHost) {
      const opensUrlObj = {
        protocol: 'https',
        hostname: this.apiHost,
        pathname: `${this.opensPath}/${this.campaignId}`
      };
      opensUrlObj.query = this._trackingQueryString();
      return url.format(opensUrlObj);
    }
  }

  _trackingQueryString() {
    return omitEmpty({ r: this.recipientId, u: this.userId, l: this.listId, s: this.segmentId });
  }

  _appendFooter(body) {
    return new Promise((resolve) => {
      if (this.options.footer) {
        const footer = this._buildFooter(this._buildUnsubscribeUrl(), this.metadata);
        resolve(`${body} ${footer}`);
      } else {
        resolve(body);
      }
    });
  }

  _buildUnsubscribeUrl() {
    const unsubscribePath = `lists/${this.listId}/recipients/${this.recipientId}/unsubscribe`;
    const unsubscribeUrl = {
      protocol: 'https',
      hostname: this.unsubscribeApiHost,
      pathname: unsubscribePath,
      query: { cid: this.campaignId }
    };
    return url.format(unsubscribeUrl);
  }

  async _buildReSubscribeUrl() {
    if(this.body.indexOf('resubscribe_url') == -1) { return '' }
    const list = await this._createReSubscribeList()
    const resubscribePath = `lists/${this.listId}/recipients/${this.recipientId}/resubscribe`;
    const resubscribeUrl = {
      protocol: 'https',
      hostname: this.unsubscribeApiHost,
      pathname: resubscribePath,
      query: { cid: this.campaignId, l: list.id }
    };
    return url.format(resubscribeUrl);
  }

  async _createReSubscribeList() {
    const newListId = base64url.encode(this.listId + 'resubscribe')
    const existingList = await List.get(this.userId, this.listId)
    const newList = Object.assign({}, existingList)
    newList.id = newListId
    const existingNewList = await List.get(this.userId, newListId)
    if(existingNewList.id){ return existingNewList }
    newList.name = newList.name + ' RESUBSCRIBE'
    newList.importStatus = { }
    newList.awaitingConfirmation = 0
    newList.bouncedCount = 0
    newList.subscribedCount = 0
    newList.total = 0
    newList.unsubscribedCount = 0
    await List.save(newList)
    return newList
  }

  _buildFooter(unsubscribeUrl, metadata = {}) {
    return `<table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tbody>
          <tr>
            <td align="center" valign="top" style="padding-top:20px;padding-bottom:20px">
              <table border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
                <tbody>
                  <tr>
                    <td align="center" valign="top" style="color:#666;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:23px;padding-right:20px;padding-bottom:5px;padding-left:20px;text-align:center">
                      This email was sent to<span>&nbsp;</span>
                      <a href="mailto:${this.to}" style="color:rgb(64,64,64)!important" target="_blank">${this.to}</a><span>&nbsp;|&nbsp;</span>
                      <a href="${unsubscribeUrl}" style="color:rgb(64,64,64)!important" target="_blank">Unsubscribe from this list</a>
                      <br />
                      ${metadata.address}
                      <a href="https://moonmail.io/?utm_source=newsletter&utm_medium=moonmail-user&utm_campaign=user-campaigns" target="_blank">
                        <img src="https://s3-eu-west-1.amazonaws.com/static.moonmail.prod.eu-west-1/moonmail-logo.png" border="0" alt="Email Marketing Powered by MoonMail" title="MoonMail Email Marketing" width="130" height="28" />
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>`;
  }

}

module.exports.Email = Email;
