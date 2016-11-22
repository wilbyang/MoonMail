import * as chai from 'chai';
import { IncrementAggregatedEventsService } from './increment_aggregated_events_service';

const expect = chai.expect;

describe('IncrementAggregatedEventsService', () => {
  let incrementerService;
  const campaignId = 'my-campaign';
  const anotherCampaignId = 'another-campaign';
  const dynamoStreamRecords = [
    {
      eventName: 'INSERT',
      dynamodb: {
        NewImage: {campaignId: {S: campaignId}, timestamp: {N: 1476178088}}
      }
    },
    {
      eventName: 'INSERT',
      dynamodb: {
        NewImage: {campaignId: {S: campaignId}, timestamp: {N: 1476178089}}
      }
    },
    {
      eventName: 'INSERT',
      dynamodb: {
        NewImage: {campaignId: {S: campaignId}, timestamp: {N: 1476178089}}
      }
    },
    {
      eventName: 'INSERT',
      dynamodb: {
        NewImage: {campaignId: {S: campaignId}, timestamp: {N: 1471178089}}
      }
    },
    {
      eventName: 'INSERT',
      dynamodb: {
        NewImage: {campaignId: {S: anotherCampaignId}, timestamp: {N: 1476178089}}
      }
    }
  ];

  before(() => {
    incrementerService = new IncrementAggregatedEventsService(dynamoStreamRecords);
  });

  describe('#countByItem()', () => {
    it('should return a multidimensional array of campaign occurences count', done => {
      const countByItem = incrementerService.countByItem;
      expect(countByItem).to.have.lengthOf(3);
      const firstItem = countByItem[0];
      expect(firstItem[0][0]).to.equal(campaignId);
      expect(firstItem[1]).to.equal(1);
      const secondItem = countByItem[1];
      expect(secondItem[0][0]).to.equal(campaignId);
      expect(secondItem[1]).to.equal(3);
      const thirdItem = countByItem[2];
      expect(thirdItem[0][0]).to.equal(anotherCampaignId);
      expect(thirdItem[1]).to.equal(1);
      done();
    });
  });
});
