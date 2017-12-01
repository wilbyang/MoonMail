import Joi from 'joi';

const listRecipientImported = 'lists.recipientImported';

const eventSchemas = {
  [listRecipientImported]: {
    schema: Joi.object({
      type: listRecipientImported,
      payload: Joi.object({
        recipient: Joi.object({
          email: Joi.string().required().email(),
          listId: Joi.string().required(),
          userId: Joi.string().required(),
          metadata: Joi.object()
        }).required(),
        totalRecipients: Joi.number().required(),
        recipientIndex: Joi.number().required(),
        importId: Joi.string().required()
      }).required()
    })
  }
};

const isValid = (event) => {
  try {
    const result = eventSchemas[event.type].schema.validate(event);
    return !result.error;
  } catch (err) {
    return false;
  }
};

export default {
  listRecipientImported,
  isValid
};
