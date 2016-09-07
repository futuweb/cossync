var qcloud = require('qcloud_cos');
var glob = require('glob');
var async = require('async');
var path = require('path');
var fs = require('fs');
var mime = require('mime');

var Exports = function(options){
	qcloud.conf.setAppInfo(options.appId, options.secretId, options.secretKey); 
	var expired = parseInt(Date.now() / 1000) + options.expired;
	qcloud.auth.signMore(options.bucket, expired);
	

	this.root = options.remotePath;
	this.bucket = options.bucket;
	this._cos = qcloud.cos;
};

Exports.prototype.sync = function(filePath, mimeConf, maxAge, callback){
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

		console.log('[Main  ]ready to create root folder:' + _this.root);

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

			console.log('[Main  ]create root folder successed');

			async.mapSeries(files, function(file, callback){
				var localPath = path.join(filePath, file);
				var remotePath = _this.root + file ;
				var stat = fs.statSync(localPath);

				if(stat.isFile()){
					process.stdout.write('[Upload]' + localPath + ' --> ' + remotePath + ' ');

					qcloud.cos.upload(localPath, _this.bucket, remotePath, '', 0, function(data){
						var err;
						// 成功，目录已存在
						var successCode = [0, -4018, -177];
						if(successCode.indexOf(data.code) === -1){
							err = new Error('code:' + data.code + ', message:' + data.message);
							process.stdout.write('failed.\n');
							console.log(err);
							callback(err);
						}else{
							process.stdout.write('ok.\n');

							// 设置MIME
							if(mimeConf){
								var thisMime = '';
								var thisExt = path.extname(remotePath);
								// 优先查找自定义设置
								for(var ext in mimeConf){
									if(thisExt === ext){
										thisMime = mimeConf[ext];
									}
								}
								// 如果没有自定义的，且开启默认MIME匹配的
								if(!thisMime && mimeConf.default){
									thisMime = mime.lookup(remotePath);
									if(thisMime){
										process.stdout.write('[MIME  ]' + thisMime + ' from default.');
									}
								}else{
									process.stdout.write('[MIME  ]' + thisMime + ' from config.');
								}
								if(!thisMime){
									thisMime = 'application/octet-stream';
									process.stdout.write('[MIME  ]' + thisMime + ' from fallback.');
								}
								// 设置headers
								qcloud.cos.updateFile(_this.bucket, remotePath, '', '',	{
									'Cache-Control': 'max-age=' + maxAge,
									'Content-Type' : thisMime,
									'Content-Disposition' : 'filename="' + path.basename(remotePath) + '"'
								}, function(data){
									if(+data.code === 0){
										process.stdout.write('ok.\n');
										callback(null);
									}else{
										var err = new Error('code:' + data.code + ', message:' + data.message);
										process.stdout.write('failed.\n');
										conosle.log(err);
										callback(err);
									}
								});
							}else{
								callback(null);
							}
						}
						// callback(err);
					});
				}else if(stat.isDirectory()){
					process.stdout.write('[Folder]' + localPath + ' --> ' + remotePath + ' ');
					qcloud.cos.createFolder(_this.bucket, _this.root + file, '', function(data){
						var err;
						var successCode = [0, -178];
						if(successCode.indexOf(data.code) === -1){
							err = new Error('code:' + data.code + ', message:' + data.message);
							process.stdout.write('failed.\n');
							console.log(err);
						}else{
							process.stdout.write('ok.\n');
						}
						callback(err);
					});
				}
			}, callback);
		});

	});
};


module.exports = Exports;