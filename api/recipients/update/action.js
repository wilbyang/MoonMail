import { update } from '../model/recipient';
import { debug } from '../../lib/logger';

export function respond(event, cb){
  if(event.recipient){
    let recipient = event.recipient;
    recipient.id = recipient.id || event.id;
    update(recipient).then( recipient => {
      return cb(null, recipient);
    }).catch( e => {
      debug(e);
      return cb(e);
    });
  }else{
    return cb("no recipient provided");
  }
}
