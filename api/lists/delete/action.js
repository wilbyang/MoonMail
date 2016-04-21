import { markAsDeleted } from '../model/list';
import { DEBUG } from '../../lib/logger';

export function respond(event, cb){
  markAsDeleted(event.id).then(() => {
    return cb(null, null);
  }).catch( e => {
    DEBUG(e);
    return cb(e);
  });
}
