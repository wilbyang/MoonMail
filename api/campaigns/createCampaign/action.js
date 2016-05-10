'use strict';

import { create } from '../model/campaign';
import { debug } from '../../lib/logger';

export function respond(event, cb) {
  debug('= createCampaign.action', JSON.stringify(event));
  if(event.recipient){
    let recipient = event.recipient;
    recipient.recipientStatus = recipient.recipientStatus || 'NORMAL';
    recipient.createdAt = new Date().toString();
    create(recipient).then( recipient => {
      return cb(null, recipient);
    }).catch( e => {
      debug(e);
      return cb(e);
    });
  }else{
    return cb("no recipient specified");
  }
}
