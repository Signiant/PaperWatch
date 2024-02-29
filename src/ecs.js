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

    // Some of the log groups are named like `ecs/environment-application-service`,
    // some with a leading slash like `/ecs/environment-application-service`, and
    // some with the service after a slash like `/ecs/environment-application/service`.
    // This normalizes them, extracting the environment, application, and service.
    var logGroupName = data.logGroup.replace(/^\/?ecs\//, '');
    var nameParts = logGroupName.split(/[-\/]/)

    var env = nameParts[0]
    var app = nameParts[1]
    var service = nameParts[2]
    var hostname = [env, app].join('-')
    var program = service;

    // Construct the winston transport for forwarding ECS logs to papertrail
    var papertrail = new winston.transports.Papertrail({
      host: paperTrailHost,
      port: paperTrailPort,
      hostname: hostname,
      program: program,
      logFormat: function(level, message){
        return message;
      }
    });
    // post the logs
    logger.post(data, papertrail, callback);
  });
};
