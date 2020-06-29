// Dependencies
var AWS = require('aws-sdk');
var apiGateway = new AWS.APIGateway({apiVersion: '2015-07-09'});
var config = require('../config/paperwatch.json');
var logger = require('./lib/logger');
var winston = require('winston');
require('winston-papertrail').Papertrail;

var restApis;

// Handler function
exports.handler = function(event, context, callback){
  // Ensure RestAPI map is initialized before handling logs
  if(restApis == null){
    apiGateway.getRestApis({ limit: 500 }, function(err, data){
      if(err){
        console.warn("Unable to retrieve Rest APIs");
        console.warn(err.code, "-", err.message);
      }else{
        // Construct RestAPI map using id as key, name as value
        if(data.items)
          restApis = data.items.reduce(function(map, api){
            map[api.id] = api.name.replace(" ", "_");
            return map;
          }, {});

      }
      // Continue
      constructTransport(event, callback);
    });
  }else{
    // Map exists, continue
    constructTransport(event, callback);
  }
};

// Builds the logging transport and posts the logs
function constructTransport(event, callback){
  // Extract data from event
  logger.extract(event, function(err, data){
    if(err)
      return callback(err);


    // Construct the program name from the log group name
    var program = data.logGroup.split("_").splice(1).join("_").split("/");

    // If possible, replace the api ID with it's name
    if(restApis && restApis[program[0]])
      program[0] = restApis[program[0]];

    program = program.join("_");

    // Construct the winston transport for forwarding lambda logs to papertrail
    var papertrail = new winston.transports.Papertrail({
      host: config.host,
      port: config.port,
      hostname: "API-Gateway_" + data.owner + "_" + process.env.AWS_REGION,
      program: program,
      logFormat: function(level, message){
        return message;
      }
    });
    // post the logs
    logger.post(data, papertrail, callback);
  });
}
