var qcloud = require('qcloud_cos');
var glob = require('glob');
var async = require('async');
var path = require('path');
var fs = require('fs');

var Exports = function(options){
	// qcloud.conf.setAppInfo('10001549','AKIDRy6CUyjteb2hB3QSGltPIW0g8bV5RHc1','u9PNlkfuVLZW2r5mUDBrQyvhtxWaOl0t'); 
	qcloud.conf.setAppInfo(options.appId, options.secretId, options.secretKey); 
	var expired = parseInt(Date.now() / 1000) + options.expired;
	qcloud.auth.signMore(options.bucket, expired);
	

	this.root = options.remotePath;
	this.bucket = options.bucket;
	this._cos = qcloud.cos;
};

Exports.prototype.sync = function(filePath, callback){
	var _this = this;

	glob('**/*', {
		cwd:filePath,
		ignore:['**/node_modules/**']
	}, function (err, files) {
		// 遍历文件出错
		if(err) {
			callback(err);
			return;
		}

		console.log('ready to create root folder:' + _this.root);

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
				var localPath = path.join(filePath, file);
				var remotePath = _this.root + file ;
				var stat = fs.statSync(localPath);

				process.stdout.write(localPath + ' --> ' + remotePath + ' ');

				if(stat.isFile()){
					process.stdout.write('uploading...');

					qcloud.cos.upload(localPath, _this.bucket, remotePath, '', 0, function(data){
						var err;
						// 成功，目录已存在
						var successCode = [0, -4018, -177];
						if(successCode.indexOf(data.code) === -1){
							err = new Error('code:' + data.code + ', message:' + data.message);
							process.stdout.write('failed\n');
							console.log(err);
						}else{
							process.stdout.write('ok\n');
						}
						callback(err);
					});
				}else if(stat.isDirectory()){
					process.stdout.write('creating...');
					qcloud.cos.createFolder(_this.bucket, _this.root + file, '', function(data){
						var err;
						var successCode = [0, -178];
						if(successCode.indexOf(data.code) === -1){
							err = new Error('code:' + data.code + ', message:' + data.message);
							process.stdout.write('failed\n');
							console.log(err);
						}else{
							process.stdout.write('ok\n');
						}
						callback(err);
					});
				}
			}, callback);
		});

	});
};


module.exports = Exports;