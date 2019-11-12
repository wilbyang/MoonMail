import * as chai from 'chai';

const chaiCheerio = require('chai-cheerio');
const chaiAsPromised = require('chai-as-promised');
const chaiFuzzy = require('chai-fuzzy');

import { expect } from 'chai';
import { LinksParser } from './links_parser';
import * as cheerio from 'cheerio';
import base64url from 'base64-url';

chai.use(chaiFuzzy);
chai.use(chaiAsPromised);
chai.use(chaiCheerio);

describe('LinksParser', () => {
  const linkUrls = ['http://example.com', 'http://anotherexample.com'];
  const skipLinkUrls = ['http://example-skip.com', 'http://anotherexample-skip.com'];
  const mailtoLinkUrl = 'mailto:david.garcia@microapps.com';
  const unsubscribeUrl = '{{ unsubscribe_url }}';
  const unsubscribeText = 'unsubscribe here';
  const linksText = ['some link', 'another link', 'unsubscribe from this list'];
  const unsubscribeLink = `<a href="${unsubscribeUrl}">${unsubscribeText}</a>`;
  const htmlLinks = [`<a href="${linkUrls[0]}">${linksText[0]}</a>`, `<a href="${linkUrls[1]}">${linksText[1]}</a>`];
  const htmlSkipLinks = [`<a mm-disable-tracking="true" href="${skipLinkUrls[0]}">${linksText[0]}</a>`, `<a mm-disable-tracking="true" href="${skipLinkUrls[1]}">${linksText[1]}</a>`];
  const htmlMailtoLink = `<a href="${mailtoLinkUrl}">${linksText[0]}</a>`;
  const htmlBody = `This piece of HTML contains not only ${htmlLinks[0]} but ${htmlLinks[1]}, and this is the unsubscribe ${unsubscribeLink}`;
  const htmlSkipBody = `This piece of HTML contains not only ${htmlSkipLinks[0]} but ${htmlSkipLinks[1]}`;
  const htmlMailtoBody = `This piece of HTML contains a mailto ${htmlMailtoLink}`;
  const segmentId = 'some-segment-id';
  const campaign = { id: 'campaign-id' };
  const listId = 'some-list-id';
  const recipient = { id: 'recipient-id', listId };
  const userId = 'user-id';
  const linkId = 'some_link_id';
  const apiHost = 'fakeapi.com';
  const opensTrackingUrl = `https://${apiHost}/links/open/${campaign.id}`;
  const clicksTrackingUrl = `https://${apiHost}/links/click/${campaign.id}/${linkId}`;
  const context = { campaign, recipient, userId };
  let links;

  before(() => {
    process.env.ENCRYPTION_PWD = '12345';
    links = new LinksParser({ apiHost, context, clicksHost: apiHost});
  });

  describe('#opensTrackUrl()', () => {
    it('returns the URL to track opens', (done) => {
      expect(links.opensTrackUrl).to.contain(opensTrackingUrl);
      expect(links.opensTrackUrl).to.contain(base64url.encode(userId));
      expect(links.opensTrackUrl).to.contain(recipient.id);
      expect(links.opensTrackUrl).to.contain(recipient.listId);
      //expect(links.opensTrackUrl).to.contain(campaign.segmentId);
      done();
    });
  });

  describe('#appendOpensPixel()', () => {
    it('appends the opens tracking image', (done) => {
      const imgTrackingTag = `<img src="${opensTrackingUrl}`;
      expect(links.appendOpensPixel(htmlBody)).to.eventually.contain(imgTrackingTag).notify(done);
    });
  });

  describe('#appendRecipientIdToLinks', () => {
    it('skips malformed links', (done) => {
      const malformedLinkBody = `${htmlBody} <a>No href</a>`;
      links.appendRecipientIdToLinks(malformedLinkBody).then((result) => {
        expect(result).to.exist;
        done();
      }).catch(done);
    });
  });

  describe('#clicksTrackUrl()', () => {
    it('returns the URL to track clicks', (done) => {
      const encodedLinkUrl = encodeURIComponent(linkUrls[0]);
      expect(links.clicksTrackUrl(linkId, linkUrls[0])).to.equal(`${clicksTrackingUrl}?ctx=cq7I2VeDbMn%2FfY5a%2BFpaNuWrCWYZ5RzJIXiP2kh8w5s%3D`);
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
            expect(parsedUrl).to.contain(apiHost);
          }
        });
        done();
      }).catch(done);
    });
    it('skips the unsubscribe_url link', (done) => {
      links.parseLinks(htmlBody).then((result) => {
        expect(result.parsedBody).to.contain(unsubscribeLink);
        done();
      }).catch(done);
    });
    it('skips the mm-disable-tracking links', (done) => {
      links.parseLinks(htmlSkipBody).then((result) => {
        skipLinkUrls.forEach(url => expect(result.parsedBody).to.contain(url));
        done();
      }).catch(done);
    });
    it('skips mailto links', (done) => {
      links.parseLinks(htmlMailtoBody).then((result) => {
        expect(result.parsedBody).to.contain(mailtoLinkUrl);
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
