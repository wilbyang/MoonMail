export default (event, context) => {
  // must return a promise, a JSON.stringify compatible data, null or nothing.
  return {
    event: JSON.stringify(event)
  }
}

