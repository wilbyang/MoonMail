import { getAll } from '../model/recipient';
import { DEBUG } from '../../lib/logger';

export function respond(event, cb){
  const query = JSON.parse(event.query);
  let page;
  if(query.page){
    page = JSON.parse(new Buffer(query.page, 'base64').toString('utf-8'));
  }
  const params = {
    list_id: event.list_id,
    status: query.status,
    limit: query.limit || 100,
    page: page
  };
  getAll(event.list_id, params).then(data => {
    let result = {
      items: data.Items
    };
    if(data.LastEvaluatedKey){
      result.page = new Buffer(JSON.stringify(data.LastEvaluatedKey)).toString('base64');
    }
    return cb(null, result);
  }).catch(e => {
    DEBUG(e);
    return cb(e);
  });
}
