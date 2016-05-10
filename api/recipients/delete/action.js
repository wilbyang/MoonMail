import { remove } from '../model/recipient';
import { debug } from '../../lib/logger';

export function respond(event, cb){
  remove(event.id).then(() => {
    return cb(null, null);
  }).catch( e => {
    debug(e);
    return cb(e);
  });
}
