module.exports.DEBUG = function() {
  if(process.env.DEBUG){
    console.log.apply(console, arguments);
  }
}
