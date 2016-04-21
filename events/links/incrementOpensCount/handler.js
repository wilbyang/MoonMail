export default (event, context) => {
  // must return a promise, a JSON.stringify compatible data, null or nothing.
  console.log('= incrementOpensCount.handler', JSON.stringify(event));
  return {
    message: 'Go Serverless! Your Lambda function executed successfully!'
  }
}

