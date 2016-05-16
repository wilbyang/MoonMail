import { get } from '../model/recipient';
import { debug } from '../../lib/logger';

export function respond(event, cb){
  get(event.id).then( recipient => {
    return cb(null, recipient);
  }).catch( e => {
    debug(e);
    return cb(e);
  });
}
