// Dependencies
var config = require('../config/syslog.json');
var logger = require('./lib/logger');
var winston = require('winston');
require('winston-syslog').Syslog;

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

    var nameParts = data.logGroup.split('/').pop().split('-')
    var env = nameParts[0]
    var app = nameParts[1]
    var service = nameParts[2]

    var syslog = new winston.transports.Syslog({
      level: 'silly',
      host: syslogHost,
      port: syslogPort,
      app_name: [env, app, service].join('_'),
    });
    // post the logs
    logger.post(data, syslog, callback);
  });
};
