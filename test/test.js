'use strict';

var Cossync = require('./../index.js');

var cos = new Cossync({
    "appId":"你的appid",
    "secretId":"你的secretId",
    "secretKey":"你的secretKey",
    "expired":1800,
    "bucket":"你的仓库",
    "maxAge":60,
    "timeout":100,
    "strict":true,
    "remotePath":"你的腾讯cos目录",
});

cos.async('E:/source/demo/' , function(err , result){
	console.log(err , result);
});