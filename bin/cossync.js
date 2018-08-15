#!/usr/bin/env node

'use strict';

var path = require('path');
var version = require('../package.json').version;
var cossync = require('../index').cossync;
var conf = require(path.join(process.cwd(), process.argv[2] || 'cossyncconf.json'));
var cos = cossync(conf);
var tryTimes = 3;

console.log('------------------------CosSync v' + version + '---------------------------');

function callback(err , result){
    console.log('[CI] <======== done.');
    if ( err ){
        console.log('[CI] is error ' + err);
        if ( tryTimes > 0 ){
            tryTimes --;
            console.log('\n[CI] <===== will try agian. ' + tryTimes);
            return runCos(result);
        }
        console.log('[CI] <======== has error.\n\n');
        process.exit(1);
    }
    console.log('[CI] <======== all success.\n\n');
    process.exit(0);
}

function runCos(result){
    if ( conf.version === 'v5' ){
        cos.upload(conf.localPath , conf.globConfig , callback);
    }else {
        cos.upload(conf.localPath, conf.mime, conf.maxAge || conf.cacheMaxAge || 0, callback);
    }
}

console.log('[CI] =======> will run , please wait......');

console.log('[CI] -------- ' + conf.localPath + ' ==> ' + conf.remotePath);

if ( conf.version === 'v5' ){
    cos.sync(conf.localPath , conf.globConfig , callback);
}else {
    cos.sync(conf.localPath, conf.mime, conf.maxAge || conf.cacheMaxAge || 0, callback);
}
