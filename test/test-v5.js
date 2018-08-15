var cossync = require('./../index.js').cossync;

var conf = {
    secretId:'DGFDFGDFGDFGDF',
    secretKey:'DFGDFGDFGDFGDFGDFDFGDFG',
    bucket:'ertretretr-12500000',
    strict:true,
    version:'v5',
    region:'na-ashburn',
    remotePath:'/test/',
    localPath: '/data',
    globConfig:{
      ignore:["node_modules/**"],
      nodir:true
    }
};

var cos = cossync(conf);

cos.sync(conf.localPath , conf.globConfig , function(err , result){
  console.log(err , result);
});