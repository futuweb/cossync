#!/usr/bin/env node

var path = require('path');
var fs = require('fs');
var confPath = process.argv[2];
if(!confPath){
	confPath = 'cossyncconf.json';
}
var localPath = path.join(process.cwd(), confPath);
var tryPaths = [localPath, confPath];

var conf;

console.log('\n\n------------------- CosSync v'+require('../package.json').version+' --------------------');

tryPaths.forEach(function(tryPath){

	if(!conf){
		try{
			conf = require(tryPath);
			console.log('[CLI   ]using config file: ' + tryPath);
		}catch(e){

		}
	}

});

if(!conf){
	console.log('[CLI   ]No conf file found. Please specify a conf file or make a `cossyncconf.json` in current directory.');
	return;
}

var Cos = require('../index');
var cos = new Cos(conf);

var tryTimes = 3;

var doSync = function(){
	cos.sync(conf.localPath, conf.mime, conf.cacheMaxAge || 0, function(err){
		if(err){
			console.log('[CLI   ]error!', err);
			if(--tryTimes){
				console.log('[CLI   ]ready to do #' + (3 - tryTimes) + ' retry afert 1s.');
				setTimeout(doSync, 1000);
			}else{
				console.log('[CLI   ]Still error, abort!');
				console.log('------------------- CosSync v'+require('../package.json').version+' --------------------\n\n');
				process.exit(1);
			}
		}else{
			console.log('[CLI   ]finished!');
			console.log('------------------- CosSync v'+require('../package.json').version+' --------------------\n\n');
		}
	});
};

doSync();
