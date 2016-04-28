import { get } from '../model/recipient';
import { DEBUG } from '../../lib/logger';

export function respond(event, cb){
  get(event.id).then( recipient => {
    return cb(null, recipient);
  }).catch( e => {
    DEBUG(e);
    return cb(e);
  });
}
