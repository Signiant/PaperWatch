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

    if(config.host == "<HOST NAME>"){
    // use default paperwatch.json that is not set with papertrail host or port
    // control tower customization deployment. host and port will be set as env variables
        var paperTrailHost = process.env.PAPERTRAIL_HOST;
        var paperTrailPort = process.env.PAPERTRAIL_PORT;
    }else{
        var paperTrailHost = config.host;
        var paperTrailPort = config.port;
    }

    // Construct the winston transport for forwarding lambda logs to papertrail
    var papertrail = new winston.transports.Papertrail({
      level: 'silly',
      host: paperTrailHost,
      port: paperTrailPort,
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
