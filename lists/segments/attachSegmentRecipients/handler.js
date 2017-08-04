import { configureLogger } from '../../lib/index';
import respond from './action';

export default (event, context) => {
  configureLogger(event, context);
  respond(event, Object.assign({}, context, { getRemainingTimeInMillis: () => 300000 }), (error, response) => context.done(error, response));
};
