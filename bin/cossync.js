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

tryPaths.forEach(function(tryPath){

	if(!conf){
		try{
			conf = require(tryPath);
			console.log('using config file: ' + tryPath);
		}catch(e){

		}
	}

});

if(!conf){
	console.log('No conf file found. Please specify a conf file or make a `cossyncconf.json` in current directory.');
	return;
}

var Cos = require('../index');
var cos = new Cos(conf);

cos.sync('./', function(err){
	if(err){
		console.log('error!', err);
	}else{
		console.log('finished!');
	}
});