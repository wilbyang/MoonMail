import 'babel-polyfill';
import base64url from 'base64-url';
import { debug } from './index';
import * as url from 'url';
import * as cheerio from 'cheerio';
import cuid from 'cuid';

class LinksParser {
  constructor({ apiHost, context } = {}) {
    this.apiHost = apiHost;
    this.campaignId = context.campaign.id;
    this.recipientId = context.recipient.id;
    this.userId = base64url.encode(context.userId);
    this.opensPath = 'links/open';
    this.clicksPath = 'links/click';
  }

  get opensTrackUrl() {
    if (this.apiHost) {
      const opensUrlObj = {
        protocol: 'https',
        hostname: this.apiHost,
        pathname: `${this.opensPath}/${this.campaignId}`
      };
      if (this.recipientId) opensUrlObj.query = { r: this.recipientId, u: this.userId };
      return url.format(opensUrlObj);
    }
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

  parseLinks(body) {
    return new Promise((resolve) => {
      const $ = cheerio.load(body);
      let campaignLinks = {
        id: this.campaignId,
        links: {}
      };
      $('a').each((i, link) => {
        const linkUrl = $(link).attr('href');
        if (linkUrl) {
          if (!this._isUnsubscribeLink(linkUrl)) {
            const linkText = $(link).text() || '-';
            const linkId = cuid();
            const clickTrackUrl = this.clicksTrackUrl(linkId, linkUrl);
            $(link).attr('href', clickTrackUrl);
            campaignLinks.links[linkId] = { url: linkUrl, text: linkText };
          }
        }
      });
      const result = {
        parsedBody: $.html(),
        campaignLinks
      };
      resolve(result);
    });
  }

  appendRecipientIdToLinks(body) {
    if (this.recipientId) {
      return new Promise((resolve, reject) => {
        const $ = cheerio.load(body);
        $('a').each((i, link) => this._appendTrackingInfo(link, $));
        return resolve($.html());
      });
    } else {
      return Promise.resolve(body);
    }
  }

  _appendTrackingInfo(link, $) {
    const linkUrl = $(link).attr('href');
    const uri = url.parse(linkUrl, true);
    if (linkUrl && !this._isUnsubscribeLink(linkUrl) && this._isRedirectionLink(uri)) {
      delete uri.search;
      uri.query.r = this.recipientId;
      uri.query.u = this.userId;
      $(link).attr('href', uri.format());
    }
  }

  _isUnsubscribeLink(linkUrl) {
    return linkUrl && linkUrl.indexOf('unsubscribe_url') > -1;
  }

  _isRedirectionLink(uri) {
    return uri.protocol === 'https:' && this.apiHost.includes(uri.hostname);
  }

  clicksTrackUrl(linkId, linkUrl) {
    if (this.apiHost) {
      const clicksUrlObj = {
        protocol: 'https',
        hostname: this.apiHost,
        pathname: `${this.clicksPath}/${this.campaignId}/${linkId}`,
        query: { url: linkUrl }
      };
      return url.format(clicksUrlObj);
    }
  }
}

module.exports.LinksParser = LinksParser;
