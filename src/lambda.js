// Dependencies
var config = require('../config/paperwatch.json');
var logger = require('./lib/logger');
var winston = require('winston');
require('winston-papertrail').Papertrail;

// Handler function
exports.handler = function(event, context, callback){

  // Extract data from event
  logger.extract(event, function(err, data){
    if(err)
      return callback(err);

    // Construct the winston transport for forwarding lambda logs to papertrail
    var papertrail = new winston.transports.Papertrail({
      host: config.host,
      port: config.port,
      hostname: "Lambda_" + data.owner + "_" + process.env.AWS_REGION,
      program: data.logGroup.split('/').pop(),
      logFormat: function(level, message){
        return message;
      }
    });
    // post the logs
    logger.post(data, papertrail, callback);
  });
};
