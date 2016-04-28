# MoonMail by microapps

MoonMail, powerful email marketing tool, built on Serverless Framework allows you to deliver campaigns over Amazon’s cloud network. 

With this tool you can create different type of lists and send emails to targeted customers based on specific traits. Once your email is sent you can monitor and track the performance instantly. 

Use MoonMail open source project to store emails inside your own AWS infrastructure and if you need additional customisation contact [microapps team] (hi@microapps.com).

--

### Features:
* Create and store recipient lists
* Compile and send email campaigns

--

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

--

### Technology backing this project:

 * [serverless](https://github.com/serverless/serverless) _is the application framework for building web, mobile and IoT applications exclusively on Amazon Web Services' Lambda and API Gateway._

--
 
### [Architecture Prototype] (https://github.com/microapps/MoonMail/wiki)
<img src="https://cdn.microapps.com/assets/img/mmv2/mmv2-architecture.png"width="800">


#### [Why we decided to use Serverless Framework] (http://microapps.com/blog/serverless-framework/)

--

### Contributing
Contributions are always welcome!

--

### Credits
Developed by [microapps] (http://microapps.com/)

--
## License
MoonMail is available under the MIT license. See the LICENSE file for more info.
