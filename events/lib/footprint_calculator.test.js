import { expect } from 'chai';
import base64url from 'base64-url';
import FootprintCalculator from './footprint_calculator';

describe('FootprintCalculator', () => {
  describe('.calculate()', () => {
    const userId = 'user-id';
    const listId = 'list-id';
    const campaignId = 'campaign-id';
    const listSubscribeType = 'list.recipient.subscribe';
    const listAutomation = {userId, listId, type: listSubscribeType};
    const listEvent = {
      payload: {recipient: {listId, userId}},
      type: listSubscribeType
    };
    const listFootprint = base64url.encode(`${listId}${listSubscribeType}${userId}`);
    const openType = 'campaign.open';
    const openAutomation = {userId, id: campaignId, type: openType};
    const openEvent = {
      type: openType,
      payload: {recipient: {listId, userId}, campaign: {id: campaignId}}
    };
    const openFootprint = base64url.encode(`${campaignId}${openType}${userId}`);

    it('should calculate the correct footprint', () => {
      const automations = [
        {input: listAutomation, expected: listFootprint},
        {input: openAutomation, expected: openFootprint}
      ];
      const events = [
        {input: listEvent, expected: listFootprint},
        {input: openEvent, expected: openFootprint}
      ];
      automations.forEach(a => expect(FootprintCalculator
        .calculate(a.input, 'automation')).to.equal(a.expected));
      events.forEach(e => expect(FootprintCalculator
        .calculate(e.input, 'event')).to.equal(e.expected));
    });
  });
});
