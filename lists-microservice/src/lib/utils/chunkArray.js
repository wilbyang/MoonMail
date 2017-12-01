export default function chunkArray(array, chunkSize) {
  return Array(Math.ceil(array.length / chunkSize))
    .fill()
    .map((_, i) => array.slice(i * chunkSize, i * chunkSize + chunkSize));
}
