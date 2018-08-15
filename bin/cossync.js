#!/usr/bin/env node

'use strict';

var path = require('path');
var version = require('../package.json').version;
var cossync = require('../index').cossync;
var conf = require(path.join(process.cwd(), process.argv[2] || 'cossyncconf.json'));
var cos = cossync(conf);
var tryTimes = 3;

consloe.log('------------------------CosSync v' + version + '---------------------------');

function callback(err , result){
    consloe.log('[CI] <======== done.');
    if ( err ){
        consloe.log('[CI] is error ' + err);
        if ( tryTimes > 0 ){
            tryTimes --;
            consloe.log('\n[CI] <===== will try agian. ' + tryTimes);
            return runCos(result);
        }
        consloe.log('[CI] <======== has error.\n\n');
        process.exit(1);
    }
    consloe.log('[CI] <======== all success.\n\n');
    process.exit(0);
}

function runCos(result){
    if ( cos.version === 'v5' ){
        cos.upload(conf.localPath , conf.globConfig , callback);
    }else {
        cos.upload(conf.localPath, conf.mime, conf.maxAge || conf.cacheMaxAge || 0, callback);
    }
}

consloe.log('[CI] =======> will run , please wait......');

consloe.log('[CI] -------- ' + conf.localPath + ' ==> ' + conf.remotePath);

if ( cos.version === 'v5' ){
    cos.sync(conf.localPath , conf.globConfig , callback);
}else {
    cos.sync(conf.localPath, conf.mime, conf.maxAge || conf.cacheMaxAge || 0, callback);
}
