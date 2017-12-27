#!/usr/bin/env node

const program = require('commander');
const aws = require('aws-sdk');
const fs = require('fs');
const spectacle = require('spectacle-docs');

program
  .usage('[options]')
  .description('Deploy API Gateway documentation')
  .option('-r, --region [region]', 'AWS region')
  .option('-p, --profile [profile]', 'AWS profile')
  .option('-s, --stage [stage]', 'API Gateway stage')
  .option('-i, --api-id [apiId]', 'API Gateway ID')
  .parse(process.argv);

const credentials = new aws.SharedIniFileCredentials({ profile: program.profile });
aws.config.credentials = credentials;
aws.config.region = program.region;
const apigateway = new aws.APIGateway();

const params = {
  exportType: 'swagger',
  restApiId: program.apiId,
  stageName: program.stage,
<<<<<<< HEAD
  accepts: 'application/yaml'
};

function replaceTitle(yamlBody, newTitle) {
  const titleRE = /title:\s".*?"/;
  return yamlBody.replace(titleRE, `title: ${newTitle}`);
}

function generateDocs(swaggerString) {
  const swaggerFilePath = '/tmp/moonmail-api-swagger.yml';
  fs.writeFileSync(swaggerFilePath, swaggerString);
=======
  accepts: 'application/json'
};

function replaceTitle(swaggerJson, newTitle) {
  const newBody = Object.assign({}, swaggerJson);
  newBody.info.title = newTitle;
  return newBody;
}

function shiftBasePath(swaggerJson) {
  const prefix = swaggerJson.basePath;
  const paths = Object.keys(swaggerJson.paths).reduce((newPaths, currentPath) => {
    const newPath = `${prefix}${currentPath}`;
    return Object.assign({}, newPaths, { [newPath]: swaggerJson.paths[currentPath] });
  }, {});
  return Object.assign({}, swaggerJson, { paths, basePath: '' });
}

function generateDocs(swaggerJson) {
  const swaggerFilePath = '/tmp/moonmail-api-swagger.json';
  fs.writeFileSync(swaggerFilePath, JSON.stringify(swaggerJson));
>>>>>>> Docs generation script; Custom domain configuration
  const options = {
    specFile: swaggerFilePath,
    silent: true,
    targetDir: '/tmp/moonmail-docs/'
  };
  spectacle(options);
}

apigateway.getExport(params).promise()
<<<<<<< HEAD
  .then(data => replaceTitle(data.body, 'MoonMail API'))
=======
  .then(data => replaceTitle(JSON.parse(data.body), 'MoonMail API'))
  .then(swaggerBody => shiftBasePath(swaggerBody))
>>>>>>> Docs generation script; Custom domain configuration
  .then(swaggerBody => generateDocs(swaggerBody))
  .catch(console.log);
