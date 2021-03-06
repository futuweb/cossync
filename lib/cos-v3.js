'use strict';

var qcloud = require('qcloud_cos');
var glob   = require('glob');
var path   = require('path');
var fs     = require('fs');
var mime   = require('mime');

var log = getLog();
/**
 * [getLog 打印信息函数]
 * @return {[function]} [description]
 */
function getLog(){
    return isNodeEnv() ? function(msg){
        process.stdout.write(msg);
    } : function(msg){ console.log(msg);};
}
/**
 * [isNodeEnv 确定是Node环境吗？]
 * @return {Boolean} [true : Node ]
 */
function isNodeEnv(){
    var nodeEnv = true;
    try{
        if ( typeof window !== undefined && global === window ) {
            nodeEnv = false;
        }
    }catch(e){}
    return nodeEnv;
}
/**
 * [CosV3 接腾讯cos]
 * @param {[type]} options [参数对象]
 *
 * remotePath : 仓库目录
 * bucket     : 仓库
 * expired    : 密钥有效期
 * cos        : qcloud.cos
 * strict     : 单个文件报错是否停止上传 true or false  default : true
 * progress   : 上传进度 func
 * timeout    : 连接超时时间 s
 * expired    : 授权有效期 s
 * mime       : 文件后缀名解析
 * maxAge     : cache-control头为指定的max-age值
 */
function CosV3(options){
    if ( !(this instanceof CosV3 )) {
        return new CosV3(options);
    }
    if ( !options.remotePath || !options.bucket ) {
        return log('[Main   ] params remotePath &&  bucket is undefined.\n');
    }
    this.root      = options.remotePath;
    this.bucket    = options.bucket;
    this.cos       = qcloud.cos;
    this.mime      = options.mime || {default: true};
    this.maxAge    = options.maxAge || options.cacheMaxAge || 0;
    this.strict    = typeof options.strict === 'undefined' ? true : !!options.strict;
    this.progress  = options.progress || defaultProgress;
    //设置参数
    qcloud.conf.setAppInfo(options.appId, options.secretId, options.secretKey , options.timeout);
    //密钥有效期
    qcloud.auth.signMore(options.bucket, parseInt(Date.now() / 1000) + options.expired);
}

/**
 * [setBrowserLog 设置关闭浏览器端的打印log]
 * @param {[type]} show [description]
 */
CosV3.setBrowserLog = function(show){
    if ( !isNodeEnv() ) {
        log = show ? getLog() : function(){};
    }
};

/**
 * [emptyProgress 上传进度]
 * @param  {[type]} countConf [上传参数：total:总数 ，success:成功 , fail:失败]
 * @return {[type]}           [description]
 */
function defaultProgress(countConf){
    log('[Main   ] upload progress '+((countConf.success/countConf.total)*100).toFixed(2)+'%\n');
}

/**
 * [createError 创建错误对象]
 * @param  {[type]} errorMsg [description]
 * @return {[Error]}          [description]
 */
function createError(error){
    return (error instanceof Error) ? error : new Error(error);
}

/**
 * [traverseAllFiles 获取需要上传的文件]
 * @param  {[type]} filePath [文件夹路径]
 * @return {[Promise]}          [description]
 */
function traverseAllFiles(filePath){
    return new Promise(function(resolve , reject){
        glob('**/*' , {
            cwd:filePath,
            ignore:["**/node_modules"]
        }, function(error , files){
            if ( error ) {
                return reject(createError(error));
            }else{
                log('[Main   ] ready to traverse all files by folder.\n');
                return resolve(files);
            }
        });
    });
}
/**
 * [createFolder 创建目录]
 * @return {[Promise]} [description]
 */
function createFolder(bucket , rootRemote , folder){
    return new Promise(function(resolve , reject){
        qcloud.cos.createFolder(bucket , rootRemote+(folder ? folder :'') , '' , function(result){
            if ( [0,-178].indexOf(result.code) === -1 ){
                return reject(createError('[create ] qcloud.cos createFolder failed. code:' + result.code + ', message:' + result.message+'\n'));
            }else{
                log('[create ] qcloud.cos create folder successed. remote folder: '+(rootRemote+(folder ? folder :''))+'\n');
                return resolve(result);
            }
        });
    });
}

/**
 * [uploadFile 上传单个文件到腾讯cos]
 * @param  {[type]}   filePath   [文件本地路径]
 * @param  {[type]}   bucket     [仓库]
 * @param  {[type]}   remotePath [cos路径]
 * @return {[Promise]}              [description]
 */
function uploadFile(filePath , bucket , remotePath){
    return new Promise(function(resolve , reject){
        qcloud.cos.upload(filePath, bucket, remotePath, '', 0, function(result){
            if( [0, -4018, -177].indexOf(result.code) === -1 ){
                return reject(createError('[upload ] qcloud.cos upload file failed. code:' + result.code + ', message:' + result.message+'\n'));
            }else{
                log('[upload ] qcloud.cos upload success. file: '+filePath+'\n');
                return resolve(result);
            }
        });
    });
}

/**
 * [updateFile 更新cos文件]
 * @param  {[type]} bucket     [仓库]
 * @param  {[type]} remotePath [cos目录]
 * @param  {[type]} mimeConf   [文件类型]
 * @param  {[type]} maxAge     [缓存有效期]
 * @return {[Promise]}         [description]
 */
function updateFile(bucket , remotePath , mimeConf , maxAge){
    var thisMime = '' , 
        thisExt = path.extname(remotePath);
    // 优先查找自定义设置
    for(var ext in mimeConf){
        if(thisExt === ext){
            thisMime = mimeConf[ext];
        }
    }
    // 如果没有自定义的，且开启默认MIME匹配的
    if(!thisMime && mimeConf.default){
        thisMime = mime.lookup(remotePath);
    }
    if(!thisMime){
        thisMime = 'application/octet-stream';
    }
    return new Promise(function(resolve , reject){
        qcloud.cos.updateFile(bucket, remotePath, '', '', {
            'Cache-Control': 'max-age=' + maxAge,
            'Content-Type' : thisMime,
            'Content-Disposition' : 'filename="' + path.basename(remotePath) + '"'
        }, function(result){
            if( +result.code !== 0 ){
                return reject(createError('[update ] qcloud.cos update error. code:' + result.code + ', message:' + result.message+'\n'));
            }else{
                log('[update ] qcloud.cos update file success. remote file: '+remotePath+'\n');
                return resolve(result);
            }
        });
    });
}
/**
 * [getFilePathStats 获取文件状态]
 * @param  {[type]} pt [路径]
 * @return {[Promise]} [description]
 */
function getFilePathStats(pt){
    return new Promise(function(resolve , reject){
        fs.stat(path.normalize(pt) , function(err , stats){
            if ( err ) return reject(createError('[status ] fs.stat() get path status failed. path:' + pt +'\n'));
            return resolve(stats);
        });
    });
}
/**
 * [traverse 依次递归上传文件]
 * @param  {[type]} localPath  [本地目录]
 * @param  {[type]} that       [cos对象]
 * @param  {[type]} mimeConf   [文件类型]
 * @param  {[type]} maxAge     [缓存有效期]
 * @param  {[type]} files      [需要上传的文件数组]
 * @param  {[type]} countConf  [初始文件总数]
 * @return {[Promise]}            [description]
 */
function traverse(params , that , files , countConf){
    var file = files.shift();
    var filePath = path.normalize(path.join(params.localPath , file)), 
        remotePath = that.root + file;
    function catchError(error){
        countConf.fail++;
        if ( !that.strict ) {
            countConf.success--;
            return Promise.resolve(true);
        }
        return Promise.reject(error);
    }
    return getFilePathStats(filePath).then(function(stats){
        if ( stats.isFile() ) {//文件
            //上传
            return uploadFile(filePath , that.bucket , remotePath).then(function(){
                //更新
                return updateFile(that.bucket , remotePath , params.mimeConf , params.maxAge)['catch'](catchError);
            },catchError);
        }else if ( stats.isDirectory() ){ //目录
            return createFolder(that.bucket , that.root , file)['catch'](catchError);
        }
    },catchError).then(function(){
        countConf.success++;
        that.progress(countConf);
        if ( files.length <= 0 ) { //成功
            return Promise.resolve(countConf);
        }
        return traverse(params , that , files , countConf);
    });
}

/**
 * [sync 上传文件]
 * @param  {[type]}   localPath [目录路径]
 * @param  {[type]}   mimeConf [文件后缀匹配]
 * @param  {[type]}   maxAge   [缓存有效期]
 * @param  {Function} callback [回调]
 * @return {[this]}            [description]
 */
CosV3.prototype.sync = function(localPath, mimeConf, maxAge, callback){
    var argv = Array.prototype.slice.call(arguments) , 
        defaultCallBack = function(err){
            if (err) { 
                return log(err);
            }
        };
    if ( typeof localPath !== 'string' ) { 
        return this;
    }
    localPath = path.normalize(localPath);
    //参数转换
    if ( argv.length === 2 && typeof mimeConf === 'function' ) {
        callback = mimeConf;
    }else if ( argv.length === 3 && typeof maxAge === 'function' ) {
        callback = maxAge;
        if ( typeof mimeConf === 'number' ) {
            maxAge = mimeConf;
        }
    }
    if ( typeof mimeConf !== 'object' ) {
        mimeConf = this.mime;
    }
    if ( typeof maxAge !== 'number' ) {
        maxAge = this.maxAge;
    }
    if ( typeof callback !== 'function' ) {
        callback = defaultCallBack;
    }

    var params = {localPath:localPath , mimeConf:mimeConf , maxAge:maxAge} , 
        countConf = {total : 0 , success:0 , fail:0} , 
        files = [] , that = this;
    Promise.all([traverseAllFiles(localPath),createFolder(that.bucket , that.root)]).then(function(values){
        log('[Main   ] starting cos-v3...\n');
        log('----------------------------------------\n');
        log('[Main   ] uploading: '+localPath +' -> '+that.root +'\n');
        log('----------------------------------------\n');
        if ( values[0].length > 0 ) {
            files = values[0];
            countConf.total = files.length;
            log('[Main   ] use strict mode : ' + that.strict+'\n');
            return traverse(params , that , [].concat(values[0]) , countConf);
        }else{
            log('[Main   ] local folder is empty.\n');
            return Promise.resolve(countConf);
        }
    }).then(function(count){
        log('----------------------------------------\n');
        log(' total:' + count.total + '\n success: ' + count.success +'\n fail: '+count.fail+'\n');
        log('----------------------------------------\n');
        log('[Main   ] uploaded.\n');
        return callback(void 0 , {code:0 , files : files , localPath : localPath , remotePath:that.root , bucket : that.bucket , count:count});
    },callback);

    return this;
};
//默认关闭浏览器日志打印
CosV3.setBrowserLog(false);
module.exports = CosV3;
