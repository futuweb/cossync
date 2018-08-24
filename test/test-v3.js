'use strict';

var cossync = require('./../index.js').cossync;

var conf = {
    "appId":"5645456546",
    "secretId":"456546456456564cfgg",
    "secretKey":"dfgdgdf345435",
    "expired":1800,
    "bucket":"hgfe54",
    "remotePath":"/test/",
    "localPath":"/hexo",
    "maxAge":31536000,
    "strict":true ,
    "timeout":30,
    "mime":{
        "default": true,
        ".test": "text/plain"
    }
}

var cos = cossync(conf);

var startTime = +new Date();

cos.sync(conf.localPath , conf.mime , conf.maxAge , function(err , result){
    console.log(err , result);
    console.log('running time: ' , (Date.now() - startTime) / 1000 + 's' );
});