// Dependencies
var config = require('../../config/paperwatch.json');
var zlib = require('zlib');
var winston = require('winston');
require('winston-papertrail').Papertrail;

const logLevelExtractorRegex = new RegExp(config.logLevelExtractor)

const getLogLevel = (message) => {
  const result = logLevelExtractorRegex.exec(message);

  if (!result || result.length === 0) {
    // if unable to extract, return the default log level
    return config.defaultLogLevel;
  }
  return result[1];
}

// Extract and unzip log data from event object
exports.extract =  function(event, callback){

  var payload = Buffer.from(event.awslogs.data, 'base64');

  zlib.gunzip(payload, function(err, result){
    if(err){
      console.error("Unable to unzip event payload");
      return callback(err);
    }
    result = JSON.parse(result.toString('utf-8'));
    callback(null, result);
  });

};

// Post logs using the given transport
exports.post = function(data, transport, callback){
  // Create a new Logger using the transport parameter
  var logger = new winston.Logger({ transports: [ transport ] });

  // If the trainsport fails, return error
  transport.on('error', function(err){
    console.error("Error:", err.code, "-", err.message);
    return callback(err);
  });

  // Transport connected, log all logEvents
  transport.on('connect', function(){
      data.logEvents.forEach(function(logEvent){
        const logLevel = getLogLevel(logEvent.message);
        logger.log(logLevel, logEvent.message);
      });
      // Close transport, return successful
      logger.close();
      return callback();
  });
};
