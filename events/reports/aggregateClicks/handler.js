import respond from './action';

export default (event, context) => {
  respond(event, (error, response) => {
    return context.done(error, response);
  });
};
