import { get } from '../model/list';
import { debug } from '../../lib/logger';

export function respond(event, cb){
  get(event.id).then(list => {
    return cb(null, list);
  }).catch( e => {
    debug(e);
    return cb(e);
  });
}
