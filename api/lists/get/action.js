import { get } from '../model/list';
import { DEBUG } from '../../lib/logger';

export function respond(event, cb){
  get(event.id).then(list => {
    return cb(null, list);
  }).catch( e => {
    DEBUG(e);
    return cb(e);
  });
}
