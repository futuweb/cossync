var qcloud = require('qcloud_cos');
var glob = require('glob');
var async = require('async');
var fs = require('fs');

var Exports = function(options){
	// qcloud.conf.setAppInfo('10001549','AKIDRy6CUyjteb2hB3QSGltPIW0g8bV5RHc1','u9PNlkfuVLZW2r5mUDBrQyvhtxWaOl0t'); 
	qcloud.conf.setAppInfo(options.appId, options.secretId, options.secretKey); 
	var expired = parseInt(Date.now() / 1000) + options.expired;
	qcloud.auth.signMore(options.bucket, expired);
	

	this.root = options.root;
	this.bucket = options.bucket;
	this._cos = qcloud.cos;
};

Exports.prototype.sync = function(path, callback){
	var _this = this;

	glob("**/*", {
		ignore:['**/node_modules/**']
	}, function (err, files) {
		if(err) {
			callback(err);
			return;
		}
		console.log('ready to create root folder');
		qcloud.cos.createFolder(_this.bucket, _this.root, '', function(data){
			if(data){
				var successCode = [0, -178];
				if(successCode.indexOf(data.code) === -1){
					var err = new Error('code:' + data.code + ', message:' + data.message);
					console.log('create root folder failed', err);
					callback(err);
					return;
				}
			}
			console.log('create root folder successed');
			async.mapSeries(files, function(file, callback){
				var stat = fs.statSync(file);
				if(stat.isFile()){
					console.log(_this.root + file + ', is file, upload');
					qcloud.cos.upload(file, _this.bucket, _this.root + file, '', 0, function(data){
						var err;
						// 成功，目录已存在
						var successCode = [0, -4018, -177];
						if(successCode.indexOf(data.code) === -1){
							err = new Error('code:' + data.code + ', message:' + data.message);
							console.log('failed',err);
						}else{
							console.log('successed',err);
						}
						callback(err);
					});
				}else if(stat.isDirectory()){
					console.log(_this.root + file + ', is directory, create');
					qcloud.cos.createFolder(_this.bucket, _this.root + file, '', function(data){
						var err;
						var successCode = [0, -178];
						if(successCode.indexOf(data.code) === -1){
							err = new Error('code:' + data.code + ', message:' + data.message);
							console.log('failed',err);
						}else{
							console.log('successed',err);
						}
						callback(err);
					});
				}
			}, callback);
		});

	});
};


module.exports = Exports;



/*qcloud.cos.list('bug', '/', 20, 'eListBoth', 0, '', function(ret) {
	console.log(JSON.stringify(ret));
});

qcloud.cos.upload('demo2.jpeg', 'bug', '/下载.jpeg', '', 1, function(){
	console.log(JSON.stringify(arguments));
});*/