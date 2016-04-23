# MoonMail

Send email marketing campaigns with Amazon SES. Let Amazon Lambda compose email by email and literaly scale it to infinite. 

Create lists of recipients, store recipients (email addresses) within a DynamoDB, send the email marketing campaign and track opens and clicks.

[See the wiki for detailed specs and infrastructure graphs.] (https://github.com/microapps/MoonMail/wiki)

--

###Live Features
* Create and store recipient lists
* Compile and send email campaigns

###Upcoming Features
* Parse (track) clicked links within an email
* Download the full package as a node module
* One click upload to S3 of a recipient list + html email and shoot it using your Terminal

--

### Getting Started
You need to have installed the [Serverless Framework](https://github.com/serverless/serverless) (version 0.5.2 or higher is required to run the MoonMail API.)

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

--

 * [Proudly powered by Serverless Framework](https://github.com/serverless/serverless)

--
## License
MoonMail is available under the MIT license. See the LICENSE file for more info.
