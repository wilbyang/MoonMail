'use strict';
import * as action from './action';
import { ApiErrors } from '../../lib/errors';

export default (event, context) => {
  action.createRecipient(event)
    .then(r => context.done(r))
    .catch(e => context.done(ApiErrors.response(e)))
};
