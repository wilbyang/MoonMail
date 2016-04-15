'use strict';

import * as chai from 'chai';
const chaiCheerio = require('chai-cheerio');
const chaiAsPromised = require('chai-as-promised');
import { expect } from 'chai';
import { LinksParser } from './links_parser';
import * as cheerio from 'cheerio';

chai.use(chaiAsPromised);
chai.use(chaiCheerio);

describe('LinksParser', () => {

  const linkUrls = ['http://example.com', 'http://anotherexample.com'];
  const linksText = ['some link', 'another link'];
  const htmlLinks = [`<a href="${linkUrls[0]}">${linksText[0]}</a>`, `<a href="${linkUrls[1]}">${linksText[1]}</a>`];
  const htmlBody = `This piece of HTML contains not only ${htmlLinks[0]} but ${htmlLinks[1]}`;
  const campaignId = 'some_campaign_id';
  const linkId = 'some_link_id';
  const apiHost = 'fakeapi.com';
  const opensTrackingUrl = `https://${apiHost}/links/open/${campaignId}`;
  const clicksTrackingUrl = `https://${apiHost}/links/click/${campaignId}/${linkId}`;
  let links;

  before(() => {
    links = new LinksParser({campaignId, apiHost});
  });

  describe('#opensTrackUrl()', () => {
    it('returns the URL to track opens', (done) => {
      expect(links.opensTrackUrl).to.equal(opensTrackingUrl);
      done();
    });
  });

  describe('#appendOpensPixel()', () => {
    it('appends the opens tracking image', (done) => {
      const imgTrackingTag = `<img src="${opensTrackingUrl}" width="1" height="1" />`;
      expect(links.appendOpensPixel(htmlBody)).to.eventually.contain(imgTrackingTag).notify(done);
    });
  });

  describe('#clicksTrackUrl()', () => {
    it('returns the URL to track opens', (done) => {
      const encodedLinkUrl = encodeURIComponent(linkUrls[0]);
      expect(links.clicksTrackUrl(linkId, linkUrls[0])).to.equal(`${clicksTrackingUrl}?url=${encodedLinkUrl}`);
      done();
    });
  });

  describe('#parseLinks()', () => {
    it('replaces the link urls', (done) => {
      links.parseLinks(htmlBody).then((result) => {
        const $ = cheerio.load(result.parsedBody);
        const parsedLinks = $('a');
        parsedLinks.each((i, parsedLink) => {
          let parsedUrl = $(parsedLink).attr('href');
          let encodedLinkUrl = encodeURIComponent(linkUrls[i]);
          expect(parsedUrl).to.contain(apiHost);
          expect(parsedUrl).to.contain(encodedLinkUrl);
        });
        done();
      });
    });
    it('returns the links data', (done) => {
      links.parseLinks(htmlBody).then((result) => {
        expect(result.campaignLinks).to.have.property('id', links.campaignId);
        const linksData = result.campaignLinks.links;
        for (let i = 0; i < linksData.length; i++) {
          expect(linksData[i]).to.have.property('id');
          expect(linksData[i]).to.have.property('url', linkUrls[i]);
          expect(linksData[i]).to.have.property('text', linksText[i]);
        }
        done();
      });
    });
  });
});
