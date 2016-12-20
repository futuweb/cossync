'use strict';

var qcloud = require('qcloud_cos');
var glob = require('glob');
var async = require('async');
var path = require('path');
var fs = require('fs');
var mime = require('mime');

var Log = logMsg();
/**
 * [logMsg 打印信息]
 * @return {[type]} [description]
 */
function logMsg(){
    var node_env = true;
    try{
        if ( typeof window !== undefined && global === window ) {
            node_env = false;
        }
    }catch(e){}
    return node_env ? function(msg){
        process.stdout.write(msg);
    } : function(msg){ console.log(msg);};
}
/**
 * [Cossync description]
 * @param {[type]} options [description]
 *
 * remotePath : 仓库目录
 * bucket  : 仓库
 * cos : qclound.cos
 * strict : 单个文件报错是否停止上传 true or false  default : true
 * progress : 上传进度 func
 * timeout : 连接超时时间 s
 * expired : 授权有效期 s
 */
function Cossync(options){
    this.root = options.remotePath;
    this.bucket = options.bucket;
    this._cos = qcloud.cos;
    this.strict = typeof options.strict === 'undefined' ? true : !!options.strict;
    this.progress  = options.progress || emptyProgress;

    //设置参数
    qcloud.conf.setAppInfo(options.appId, options.secretId, options.secretKey , options.timeout);
    //设置过期时间
    qcloud.auth.signMore(options.bucket, parseInt(Date.now() / 1000) + options.expired);
}

/**
 * [emptyProgress 上传进度]
 * @param  {[type]} total   [总条数]
 * @param  {[type]} current [当前上传第几条]
 * @param  {[type]} fail    [失败条数]
 * @param  {[type]} file    [文件url]
 * @param  {[type]} success [true : 成功 ,false：失败]
 * @return {[type]}         [description]
 */
function emptyProgress(total , current , fail , file , success){
    Log('upload progress '+((current/total)*100).toFixed(2)+'% ('+fail+' files fail). the file :  '+file +' is upload '+(success ? 'success' : 'fail')+'.\n');
}
/**
 * [sync 上传文件]
 * @param  {[type]}   filePath [目录路径]
 * @param  {[type]}   mimeConf [文件后缀匹配]
 * @param  {[type]}   maxAge   [缓存有效期]
 * @param  {Function} callback [回调]
 * @return {[type]}            [description]
 */
Cossync.prototype.sync = function(filePath, mimeConf, maxAge, callback){
    var _this = this;

    glob('**/*', {cwd:filePath,ignore:['**/node_modules/**']}, function (err, files) {
        // 遍历文件出错
        if(err) {
            callback(err,'遍历文件目录出错。');
            return;
        }
        var allFilesLen = files.length , currentIndex = 0 , failLen = 0;

        Log('[Main  ]ready to create root folder:' + _this.root+'.\n');
        qcloud.cos.createFolder(_this.bucket, _this.root, '', function(data){
            if(data){
                var successCode = [0, -178];
                if(successCode.indexOf(data.code) === -1){
                    var err = new Error('code:' + data.code + ', message:' + data.message);
                    Log('[Main  ]create root folder failed.\n');
                    callback(err ,data);
                    return;
                }
            }

            Log('[Main  ]create root folder successed.\n');

            async.mapSeries(files, function(file, callback){
                var localPath = path.join(filePath, file) ,
                    remotePath = _this.root + file;
                var stat = fs.statSync(localPath);

                currentIndex++;
                if(stat.isFile()){
                    Log('[Upload]' + localPath + ' --> ' + remotePath + '.\n');
                    qcloud.cos.upload(localPath, _this.bucket, remotePath, '', 0, function(data){
                        var err;
                        // 成功，目录已存在
                        var successCode = [0, -4018, -177];
                        if(successCode.indexOf(data.code) === -1){
                            err = new Error('code:' + data.code + ', message:' + data.message);
                            Log('upload failed.\n');
                            Log(err);
                            failLen++;
                             _this.progress.call(_this , allFilesLen , currentIndex , failLen , file , false);
                            callback(_this.strict ? err : null , data);
                        }else{
                            Log('upload ok.\n');

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
                                        Log('[MIME  ]' + thisMime + ' from default.');
                                    }
                                }else{
                                    Log('[MIME  ]' + thisMime + ' from config.');
                                }
                                if(!thisMime){
                                    thisMime = 'application/octet-stream';
                                    Log('[MIME  ]' + thisMime + ' from fallback.');
                                }
                                // 设置headers
                                qcloud.cos.updateFile(_this.bucket, remotePath, '', '', {
                                    'Cache-Control': 'max-age=' + maxAge,
                                    'Content-Type' : thisMime,
                                    'Content-Disposition' : 'filename="' + path.basename(remotePath) + '"'
                                }, function(data){
                                    if(+data.code === 0){
                                        Log('update file mime ok.\n');
                                        _this.progress.call(_this , allFilesLen , currentIndex , failLen , file , true);
                                        callback(null , data);
                                    }else{
                                        var err = new Error('code:' + data.code + ', message:' + data.message);
                                        Log('update file mime failed.\n');
                                        Log(err);
                                        failLen++;
                                        _this.progress.call(_this , allFilesLen , currentIndex , failLen, file , false);
                                        callback(_this.strict ? err : null , data);
                                    }
                                });
                            }else{
                                _this.progress.call(_this , allFilesLen , currentIndex , failLen, file , true);
                                callback(null , data);
                            }
                        }
                    });
                }else if(stat.isDirectory()){
                    Log('[Folder]' + localPath + ' --> ' + remotePath + ' ');
                    qcloud.cos.createFolder(_this.bucket, _this.root + file, '', function(data){
                        var err = null;
                        var successCode = [0, -178];
                        if(successCode.indexOf(data.code) === -1){
                            err = new Error('code:' + data.code + ', message:' + data.message);
                            Log('create folder failed.\n');
                            Log(err);
                            failLen++;
                        }else{
                            Log('create folder ok.\n');
                        }
                        _this.progress.call(_this , allFilesLen , currentIndex , failLen, file , true);
                        callback(_this.strict ? err : null , data);
                    });
                }
            }, callback);
        });

    });
};


module.exports = Cossync;
