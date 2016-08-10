import { debug } from '../logger';
import request from 'request-promise';

const beeServiceParams = {
  url: 'https://auth.getbee.io/apiauth',
  method: 'POST',
  form: {
    grant_type: 'password',
    client_id: process.env.BEE_EDITOR_CLIENT_ID,
    client_secret: process.env.BEE_EDITOR_CLIENT_SECRET
  }
};

export class BeeEditorProxyService {

  static execute() {
    return new BeeEditorProxyService().execute();
  }

  constructor() {
    this.params = beeServiceParams;
  }

  execute() {
    debug('= BeeEditorProxyService.execute', this.params);
    return this._doPost();
  }

  _doPost() {
    return request(this.params);
  }
}
