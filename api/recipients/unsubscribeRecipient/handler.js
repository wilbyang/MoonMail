'use strict';
import * as action from './action';

export default (event, context) => {
  action.respond(event, (error, response) =>
    (context.done(error, response))
  );
};
