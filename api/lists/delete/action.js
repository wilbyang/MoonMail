import { markAsDeleted } from '../model/list';
import { debug } from '../../lib/logger';

export function respond(event, cb){
  markAsDeleted(event.id).then(() => {
    return cb(null, null);
  }).catch( e => {
    debug(e);
    return cb(e);
  });
}
