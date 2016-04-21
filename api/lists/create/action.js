import { create } from '../model/list';
import { DEBUG } from '../../lib/logger';

export function respond(event, cb){
  if(event.list){
    let list = event.list;
    list.userId = event.user_id;
    list.isDeleted = false.toString();
    list.createdAt = new Date().toString();
    create(list).then(list => {
      return cb(null, list);
    }).catch( e => {
      DEBUG(e);
      return cb(e);
    });
  }else{
    return cb("no list has been specified");
  }
}
