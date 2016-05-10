/**
 * Lib
 */

module.exports.respond = function (event, cb) {
  const response = {
    message: 'Your Serverless function ran successfully!'
  };

  return cb(null, response);
};

module.exports.debug = function () {
  if (process.env.DEBUG) {
    console.log.apply(console, arguments);
  }
};
