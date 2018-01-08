var merge = require('webpack-merge')
var prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  SOCKET_IO: '"http://localhost:4030"',
  // USER_AUTH: '"http://ec2-54-88-11-110.compute-1.amazonaws.com"',
  // USER_AUTH: '"http://devauth.flowz.com"',
  // USER_DETAIL: '"http://devapi.flowz.com/user"', 
  COPY_URL_PATH: '"http://localhost:3000"',
  accesskey: JSON.stringify(process.env.accesskey),
  secretkey: JSON.stringify(process.env.secretkey),
  domainkey: JSON.stringify(process.env.domainkey)
})
