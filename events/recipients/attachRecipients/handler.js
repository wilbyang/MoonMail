'use strict';
import * as action from './action';

export default (event, context) => {
  action.respond(event, function(error, response) {
    return context.done(error, response);
  });
};
