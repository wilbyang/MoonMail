import * as AWS from 'aws-sdk';
import { getAll } from '../model/recipient';
import { DEBUG } from '../../lib/logger';

AWS.config.region = process.env.SERVERLESS_REGION || 'us-east-1';

const sns = new AWS.SNS();

let retryMessages = new Set();

export function respond(event, cb){
  let msg = JSON.parse(event.Records[0].Sns.Message);
  const listIds = msg.campaign.listIds;
  sendCampaignRecipients(listIds, msg).then(()=>{
    if(!isThrottlingInProgress()){
      return cb(null, `Campaign ${msg.campaign.id} recipients have been successfully sent`);
    }
  }).catch(e => {
    DEBUG(e);
    return cb(e);
    }
  );
}

function isThrottlingInProgress(){
  return retryMessages && retryMessages.size > 0;
}

function sendCampaignRecipients(listIds, msg){
  let getLists = [];
  listIds.forEach(function(id){
    getLists.push(sendNextBatch(id, msg));
  });
  return Promise.all(getLists);
}

function sendNextBatch(id, msg){
  return getAll(id).then(data => {
    let messages = data.Items.map(r => {
      let message = msg;
      message.recipient = r;
      return publishToSns(message);
    });
    Promise.all(messages).then().catch(e =>{
      DEBUG(e);
    });
    if(data.LastEvaluatedKey){
      let params = {
        LastEvaluatedKey: data.LastEvaluatedKey
      };
      return sendNextBatch(id, params);
    }else{
      return Promise.resolve();
    }
  });
};

function publishToSns(canonicalMessage) {
  return new Promise((resolve, reject) => {
    DEBUG('AttachRecipientsService.publishToSns', 'Sending canonical message', JSON.stringify(canonicalMessage));
    const params = {
      Message: JSON.stringify(canonicalMessage),
      TopicArn: process.env.PRECOMPILE_EMAIL_TOPIC_ARN
    };
    sns.publish(params, (err, data) => {
      let email = canonicalMessage.recipient.email;
      if (err) {
        if (err.code === 'Throttling' || err.code === 'InternalFailure') {
          retryMessages.add(email);
          publishToSns(canonicalMessage);
          resolve();
        }else{
          DEBUG('AttachRecipientsService.publishToSns', 'Error sending message', err);
          reject(err);
        }
      } else {
        DEBUG('AttachRecipientsService.publishToSns', 'Message sent');
        if(retryMessages.has(email)){
          retryMessages.delete(email);
        }
        if(!isThrottlingInProgress()){
          return cb(null, `Campaign ${msg.campaign.id} recipients have been successfully sent`);
        }
        resolve(data);
      }
    });
  });
}
