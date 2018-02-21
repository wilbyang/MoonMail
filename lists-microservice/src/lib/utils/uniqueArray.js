function uniqueArray(a) {
  return [...new Set(a.map(o => JSON.stringify(o)))].map(s => JSON.parse(s));
}
export default uniqueArray;
