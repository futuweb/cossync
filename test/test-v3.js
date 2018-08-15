'use strict';

var cossync = require('./../index.js').cossync;

var conf = {
    "appId":"100012345",
    "secretId":"ABCDABCDABCDABCDABCDABCD",
    "secretKey":"abcdabcdabcd",
    "expired":1800,
    "bucket":"bucketName",
    "remotePath":"/test/",
    "localPath":"./",
    "maxAge":31536000,
    "strict":true ,
    "timeout":30,
    "mime":{
        "default": true,
        ".test": "text/plain"
    }
}

var cos = cossync(conf);

cos.sync(conf.localPath , function(err , result){
	console.log(err , result);
});