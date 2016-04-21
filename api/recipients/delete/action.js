import { remove } from '../model/recipient';
import { DEBUG } from '../../lib/logger';

export function respond(event, cb){
  remove(event.id).then(() => {
    return cb(null, null);
  }).catch( e => {
    DEBUG(e);
    return cb(e);
  });
}
