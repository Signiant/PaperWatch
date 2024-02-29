// Dependencies
var config = require('../config/syslog.json');
var logger = require('./lib/logger');
var winston = require('winston');
require('winston-syslog').Syslog;

class CustomeProducer {
  produce(d) {
    return d.message;
  }
}

// Handler function
exports.handler = function(event, context, callback){

  // Extract data from event
  logger.extract(event, function(err, data){
    if(err)
      return callback(err);

    if(config.host == "<HOST NAME>"){
        var syslogHost = process.env.SYSLOG_HOST;
        var syslogPort = process.env.SYSLOG_PORT;
    } else {
        var syslogHost = config.host;
        var syslogPort = config.port;
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

    if (env == 'staging') {
      env = 'stg'
    }
    if (env == 'production') {
      env = 'prd'
    }

    var syslog = new winston.transports.Syslog({
      level: 'info',
      host: syslogHost,
      port: syslogPort,
      localhost: [env, app].join('-'),
      app_name: service,
      customProducer: CustomProducer,
    });

    var wl = new winston.Logger({ transports: [ syslog ] });

    syslog.connect(function(error, _success) {
      if (error) {
        console.log("Error: " + error);
        callback(err);
      } else {
        data.logEvents.forEach(function(logEvent){
          wl.log('info', logEvent.message);
        });
        wl.close();
        return callback();
      }
    });
  });
};
