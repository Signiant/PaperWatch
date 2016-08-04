// Dependencies
var AWS = require('aws-sdk');
var cloudwatch = new AWS.CloudWatchLogs({apiVersion: '2014-03-28'});

// Handler function
exports.handler = function(event, context, callback){

  var functionName = event.detail.requestParameters.functionName;
  var groupName = '/aws/lambda/' + functionName;

  console.info("Unsubscribing consumer function from log group", groupName);

  var params = {
    logGroupName: groupName,
    filterName: 'Papertrail'
  };

  cloudwatch.deleteSubscriptionFilter(params, function(err, data){
    if(err){
      // If the subscription never existed, don't consider it an error
      if(err.code == "ResourceNotFoundException"){
        console.info("No log subscription found for this function");
        err = null;
      }else{
        console.error("Unable to delete subscription filter for log group", groupName);
        console.error(err.code, "-", err.message);
      }
    }

    return callback(err);
  });
};
