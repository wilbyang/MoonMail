import Joi from 'joi';

const events = {
  'list.recipient.subscribe': {
    footprintProperties: ['userId', 'listId'],
    schema: Joi.object({
      recipient: Joi.object({
        id: Joi.string().required(),
        email: Joi.string().required(),
        listId: Joi.string().required(),
        userId: Joi.string().required()
      }).required().unknown(true)
    })
  },
  'campaign.open': {
    footprintProperties: ['userId', 'campaignId'],
    schema: Joi.object({
      campaign: Joi.object({
        id: Joi.string().required(),
        userId: Joi.string().required()
      }).required().unknown(true),
      recipient: Joi.object({
        id: Joi.string().required(),
        listId: Joi.string().required()
      }).required().unknown(true)
    })
  }
};

const isValid = (event) => {
  try {
    const result = events[event.type].schema.validate(event.payload);
    return !result.error;
  } catch (err) {
    return false;
  }
};

export default {
  isValid
};
