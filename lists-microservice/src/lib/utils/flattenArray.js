export default function flattenArray(array) {
  return [].concat.apply([], array);
}
