'use strict';
const service = require('feathers-rethinkdb');
const config = require('config');
const db = config.get('dbName')
const table = config.get('tbl_tags')
const db_host = config.get('db_host')
const db_port = config.get('db_port')
const db_username = config.get('db_username')
const db_password = config.get('db_password')
let fs = require('fs');
const rootPath = require('get-root-path');
const path = require('path');

module.exports = function() {
  const app = this;
  let appDir= path.join(rootPath.rootPath, 'config/cacert');
  fs.readFile(appDir, function(err, caCert) {
  // const r = require('rethinkdbdash')({
  //   db: db,
  //   host: db_host,
  //   port:db_port,
  //   buffer: 5,
  //   // username: db_username,
  //   authKey: db_password,
  //   if(db_password){
  //     ssl: {
  //       ca: caCert
  //     }
  //   }
  // });
  var connOption= {
    db: db,
    discovery: false,
    timeout: 10,
    buffer: 5,
    authKey: db_password,
    servers: [
        {
            host: db_host,
            port: db_port
        }
    ]
}
  if(db_password && db_password.length>0) {  connOption.ssl= {ca: caCert, rejectUnauthorized: true}}
  
  const r = require('rethinkdbdash')(connOption);
  const options = {
    Model: r,
    name: 'tags',
  };

  // Initialize our service with any options it requires 
  app.use('/tags', service(options));
  app.service('/tags');
  app.service('tags').init().then(tags => {
      console.log('Created tags', tags)
  });
});
}