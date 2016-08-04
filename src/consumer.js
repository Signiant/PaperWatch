// Dependencies
var config = require('../config/paperwatch.json');
var zlib = require('zlib');
var winston = require('winston');
require('winston-papertrail').Papertrail;

// Handler function
exports.handler = function(event, context, callback) {

  var payload = new Buffer(event.awslogs.data, 'base64');

  zlib.gunzip(payload, function (err, result) {
      if (err) {
          console.error("Unable to unzip event payload");
          return callback(err);
      }
      result = JSON.parse(result.toString('utf8'));
      postLogs(result, callback);
  });
};

function postLogs(data, callback){

  // Construct a transport for logging to papertrail
  var papertrail = new winston.transports.Papertrail({
    host: config.host,
    port: config.port,
    hostname: "Lambda_" + data.owner + "_" + process.env.AWS_REGION,
    program: data.logGroup.split('/').pop(),
    logFormat: function(level, message){
      return message;
    }
  });

  // Create a new logger using the papertrail transport
  var logger = new winston.Logger({ transports: [ papertrail] });

  // If the trainsport fails, return error
  papertrail.on('error', function(err){
    console.error("Error:", err.code, "-", err.message);
    return callback(err);
  });

  // Transport connected, log all logEvents to papertrail
  papertrail.on('connect', function(){
    data.logEvents.forEach(function(logEvent){
      logger.info(logEvent.message);
    });

    // Close transport, return successful
    logger.close();
    return callback();
  });
}
