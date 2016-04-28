import { create } from '../model/recipient';
import { DEBUG } from '../../lib/logger';

export function respond(event, cb){
  if(event.recipient){
    let recipient = event.recipient;
    recipient.recipientStatus = recipient.recipientStatus || 'NORMAL';
    recipient.createdAt = new Date().toString();
    create(recipient).then( recipient => {
      return cb(null, recipient);
    }).catch( e => {
      DEBUG(e);
      return cb(e);
    });
  }else{
    return cb("no recipient specified");
  }
}
