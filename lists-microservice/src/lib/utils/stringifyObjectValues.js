function stringifyObjectValues(object) {
  return Object.keys(object).reduce((acum, key) => {
    acum[key] = object[key].toString();
    return acum;
  }, {});
}

export default stringifyObjectValues;
