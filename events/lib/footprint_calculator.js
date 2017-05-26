import base64url from 'base64-url';

const footprintPropertiesByType = {
  'list.recipient.subscribe': ['userId', 'listId'],
  'campaign.open': ['userId', 'campaignId']
};

const footprintPropertiesMapping = {
  automation: automationToFootprintAdapter,
  event: eventToFootprintAdapter
};

function automationToFootprintAdapter(automation = {}) {
  return {
    userId: automation.userId,
    listId: automation.listId,
    campaignId: automation.id
  };
}

function eventToFootprintAdapter(event = {}) {
  const payload = event.payload || {};
  return {
    userId: (payload.recipient || {}).userId,
    listId: (payload.recipient || {}).listId,
    campaignId: (payload.campaign || {}).id
  };
}

function calculate(params, source) {
  const normalizedProperties = footprintPropertiesMapping[source](params);
  const footprintProperties = footprintPropertiesByType[params.type];
  const footprintString = footprintProperties.map(prop => normalizedProperties[prop])
    .concat(params.type).sort().join('');
  return base64url.encode(footprintString);
}

export default {
  calculate
};
