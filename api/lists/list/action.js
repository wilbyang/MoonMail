import { getAll } from '../model/list';
import { debug } from '../../lib/logger';

export function respond(event, cb){
  const query = JSON.parse(event.query);
  let page;
  if(query.page){
    page = JSON.parse(new Buffer(query.page, 'base64').toString('utf-8'));
  }
  const params = {
    user_id: event.user_id,
    limit: query.limit || 100,
    page: page
  };
  getAll(event.user_id, params).then(data => {
    let result = {
      items: data.Items
    };
    if(data.LastEvaluatedKey){
      result.page = new Buffer(JSON.stringify(data.LastEvaluatedKey)).toString('base64');
    }
    return cb(null, result);
  }).catch(e => {
    debug(e);
    return cb(e);
  });
}
