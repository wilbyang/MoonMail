# MoonMail

**Send and monitor email campaigns the cost efficient way.**

## Features:
* Create and store recipient lists
* Compile and send email campaigns


### Getting Started
An installed [serverless](https://github.com/serverless/serverless) of version 0.5.2 or higher is required to run MoonMail API.

Initialize the Serverless project:
    sls project init
Create all the needed resources in your AWS account:

    sls resources deploy

Deploy all the Lambda functions:

    sls function deploy
    
Deploy MoonMail events:

    sls event deploy

Create the API Gateway endpoints:

    sls endpoint deploy

### Technology backing this project:

 * [serverless](https://github.com/serverless/serverless) _is the application framework for building web, mobile and IoT applications exclusively on Amazon Web Services' Lambda and API Gateway._
