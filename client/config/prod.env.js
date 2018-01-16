module.exports = {
  NODE_ENV: '"production"',
  // SOCKET_IO: '"http://api.flowz.com/mom"',
  SOCKET_IO: '"ws://ws.flowz.com:4030"',
  // USER_AUTH: '"http://auth.flowz.com"',
  // USER_DETAIL: '"http://api.flowz.com/user"',
  // COPY_URL_PATH: '"http://mom.flowz.com"',
  accesskey: JSON.stringify(process.env.accesskey),
  secretkey: JSON.stringify(process.env.secretkey),
  domainkey: JSON.stringify(process.env.domainkey),
}
