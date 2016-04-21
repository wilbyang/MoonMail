'use strict';

/**
 * Serverless Module: Lambda Handler
 * - Your lambda functions should be a thin wrapper around your own separate
 * modules, to keep your code testable, reusable and AWS independent
 */

// Require Logic
import * as action from './action';

// Lambda Handler
export default (event, context) => {
  action.respond(event, function(error, response) {
    return context.done(error, response);
  });
};
