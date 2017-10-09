import 'babel-polyfill';
import { configureLogger } from '../../lib/index';
/**
 * Serverless Module: Lambda Handler
 * - Your lambda functions should be a thin wrapper around your own separate
 * modules, to keep your code testable, reusable and AWS independent
 * - 'serverless-helpers-js' module is required for Serverless ENV var support.  Hopefully, AWS will add ENV support to Lambda soon :)
 */

// Require Logic
var action = require('./action');

// Lambda Handler
module.exports.handler = function(event, context) {
  configureLogger(event, context);
  action.respond(event, function(error, response) {
    return context.done(error, response);
  });
};
