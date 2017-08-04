'use strict';

import * as chai from 'chai';
const chaiCheerio = require('chai-cheerio');
const chaiAsPromised = require('chai-as-promised');
const chaiFuzzy = require('chai-fuzzy');
import { expect } from 'chai';
import { LinksParser } from './links_parser';
import * as cheerio from 'cheerio';

chai.use(chaiFuzzy);
chai.use(chaiAsPromised);
chai.use(chaiCheerio);

describe('LinksParser', () => {
  const linkUrls = ['http://example.com', 'http://anotherexample.com'];
  const unsubscribeUrl = '{{ unsubscribe_url }}';
  const unsubscribeText = 'unsubscribe here';
  const linksText = ['some link', 'another link', 'unsubscribe from this list'];
  const unsubscribeLink = `<a href="${unsubscribeUrl}">${unsubscribeText}</a>`;
  const htmlLinks = [`<a href="${linkUrls[0]}">${linksText[0]}</a>`, `<a href="${linkUrls[1]}">${linksText[1]}</a>`];
  const htmlBody = `This piece of HTML contains not only ${htmlLinks[0]} but ${htmlLinks[1]}, and this is the unsubscribe ${unsubscribeLink}`;
  const campaign = { id: 'campaign-id' };
  const recipient = { id: 'recipient-id' };
  const userId = 'user-id';
  const linkId = 'some_link_id';
  const apiHost = 'fakeapi.com';
  const opensTrackingUrl = `https://${apiHost}/links/open/${campaign.id}`;
  const clicksTrackingUrl = `https://${apiHost}/links/click/${campaign.id}/${linkId}`;
  const context = { campaign, recipient, userId };
  let links;

  before(() => {
    links = new LinksParser({ apiHost, context });
  });

  describe('#opensTrackUrl()', () => {
    it('returns the URL to track opens', (done) => {
      expect(links.opensTrackUrl).to.contain(opensTrackingUrl);
      done();
    });
  });

  describe('#appendOpensPixel()', () => {
    it('appends the opens tracking image', (done) => {
      const imgTrackingTag = `<img src="${opensTrackingUrl}`;
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
          const parsedUrl = $(parsedLink).attr('href');
          if (parsedUrl !== unsubscribeUrl) {
            const encodedLinkUrl = encodeURIComponent(linkUrls[i]);
            expect(parsedUrl).to.contain(apiHost);
            expect(parsedUrl).to.contain(encodedLinkUrl);
          }
        });
        done();
      }).catch(done);
    });
    it('skips the unsubscribe_url link', done => {
      links.parseLinks(htmlBody).then((result) => {
        expect(result.parsedBody).to.contain(unsubscribeLink);
        done();
      }).catch(done);
    });
    it('returns the links data', (done) => {
      links.parseLinks(htmlBody).then((result) => {
        expect(result.campaignLinks).to.have.property('id', links.campaignId);
        const linksData = result.campaignLinks.links;
        expect(linksData).to.containOneLike({ url: linkUrls[0], text: linksText[0] });
        expect(linksData).to.containOneLike({ url: linkUrls[1], text: linksText[1] });
        expect(linksData).not.to.containOneLike({ url: unsubscribeUrl, text: unsubscribeText });
        done();
      }).catch(done);
    });
  });
});
