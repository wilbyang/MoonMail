export default function decrypt(authToken) {
  return new Promise((resolve) => {
    resolve({sub: 'my-user-id'});
  });
}
