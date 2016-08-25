'use strict';

import { debug } from './index';
import * as url from 'url';
import * as cheerio from 'cheerio';
import cuid from 'cuid';

class LinksParser {
  constructor({ campaignId, apiHost } = {}) {
    this.campaignId = campaignId;
    this.apiHost = apiHost;
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
        if (!this._isUnsubscribeLink(linkUrl)) {
          const linkText = $(link).text() || '-';
          const linkId = cuid();
          const clickTrackUrl = this.clicksTrackUrl(linkId, linkUrl);
          $(link).attr('href', clickTrackUrl);
          campaignLinks.links[linkId] = {url: linkUrl, text: linkText};
        }
      });
      const result = {
        parsedBody: $.html(),
        campaignLinks
      };
      resolve(result);
    });
  }

  _isUnsubscribeLink(linkUrl) {
    return linkUrl && linkUrl.indexOf('unsubscribe_url') > -1;
  }

  clicksTrackUrl(linkId, linkUrl) {
    if (this.apiHost) {
      const clicksUrlObj = {
        protocol: 'https',
        hostname: this.apiHost,
        pathname: `${this.clicksPath}/${this.campaignId}/${linkId}`,
        query: {url: linkUrl}
      };
      return url.format(clicksUrlObj);
    }
  }
}

module.exports.LinksParser = LinksParser;
