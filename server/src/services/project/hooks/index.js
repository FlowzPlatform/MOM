'use strict';
const errors = require('feathers-errors');
exports.before = {

  all:[],
  find(hook){
      const query = this.createQuery(hook.params.query);
    const r = this.options.r;
console.log("Find query:--",query)
  },
  get: [],
  create(hook){
  var hookData=hook.data;

return  this.find({query:{pName:hookData.pName}}).then(reponse=>{
    
    if(reponse.length>0)
    {
      hook.result ={error:"Project already exist"}
      // return hook;
    }
    return hook;
  })

  },
  update: [],
  patch: [],
  remove: []
};


exports.after = {

  all:[],
  find:[],
  get: [],
  create:[],
  update: [],
  patch: [],
  remove: []
};





