# PaperWatch
A tool for automatically forwarding CloudWatch logs from your lambda functions to Papertrail.

## Setup

Follow these steps to set up and deploy PaperWatch to AWS:

#### 1. Configure
The consumer reads the logging endpoint from the configuration file stored at ```config/papertrail.json```.  
Modify the ```host``` and ```port``` variables in this file to point to your papertrail endpoint.  

When PaperWatch subscribes to a log group, it will reduce the log retention period to the ```retentionPeriod``` (in days).  If you do not wish to modify the retention period, simply remove this variable from the configuration file.

The ```consumer``` variable is used by the Subscribe function to determine to which lambda function the log groups should be sent to.  Do not change this value unless you are modifying the cloudformation template, or deploying without it.

*Example config:*

```
{
  "host": "samplehost.papertrailapp.com",
  "port": 12345,
  "retentionPeriod": 3
  "consumer": "PaperWatchConsumer""
}
```

#### 2. Build
Running the _build_ script will install dependencies and create the .zip deployment package (as lambda.zip)
```
paperwatch $ npm run build
```

#### 3. Deploy
First, upload the deployment package to an s3 bucket.  Take note of the bucket name, you will need this later.
This can be done with the aws-cli as follows:
```
paperwatch $ aws s3 cp ./lambda.zip s3://<BUCKET_NAME>
```

Next, create a new cloudformation stack using from the template at ```cfn/deploy.cfn.json```.  
Enter a stack name.  You will also be prompted to enter the following parameters:
- SourceBucket - the name of the s3 bucket you uploaded the deployment package to
- SourceKey - name of the deployment package in the s3 bucket (lambda.zip), including any prefixes if applicable

Once deployed, logs will be forwarded to papertrail for all new lambda functions.  
Existing functions must be subscribed manually.  


### Manual Subscription
To manually subscribe a function, navigate to the CloudWatch console and follow these steps:  
1. Locate the log group for the function you wish to subscribe, selecting it by checking the box on the left  
2. Open the _Actions_ dropdown and choose _Stream to AWS Lambda_  
3. From the Lambda Function dropdown, select _PaperWatchConsumer_ and click next  
4. From the Log Format dropdown, select _Other_ and click next  
4. Click _Start Streaming_  

PaperWatch will now begin forwarding the functions logs to Papertrail
