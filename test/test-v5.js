var cossync = require('./../index.js').cossync;

var conf = {
    secretId:'354dfgddffgdgdgw',
    secretKey:'rtyrcfg4535',
    bucket:'45435fdgfg-125000',
    strict:true,
    version:'v5',
    region:'na-ashburn',
    remotePath:'/test/',
    localPath: '/hexo',
    maxAge:31536000,
    globConfig:{
      ignore:["node_modules/**"],
      nodir:true
    }
};

var cos = cossync(conf);

cos.sync(conf.localPath , conf.globConfig , function(err , result){
  console.log(err , result);
});