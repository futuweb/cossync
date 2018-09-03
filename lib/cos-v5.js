var path   = require('path');
var fs = require('fs');

var COS = require('cos-nodejs-sdk-v5');
var glob   = require('glob');
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
 * [createError 创建错误对象]
 * @param  {[type]} errorMsg [description]
 * @return {[Error]}          [description]
 */
function createError(error){
    return (error instanceof Error) ? error : new Error(error);
}
/**
 * [traverseAllFiles 获取需要上传的文件]
 * @param  {[type]} localPath [文件夹目录]
 * @param  {[type]} config   [glob配置]
 * @return {[type]}          [description]
 */
function traverseAllFiles(localPath , config){
    log('[TraverseAllFiles   ] will traverse all files from ' + localPath + ' and config: ' + JSON.stringify(config) + '\n');

    config.cwd = localPath || process.cwd();

    return new Promise(function(resolve , reject){
        glob(config.pattern || '**/*' , config , function(error , files){
            if ( error ) {
                return reject(createError(error));
            }else{
                log('[TraverseAllFiles   ] ready to traverse all ' + files.length + ' files by folder.\n');
                return resolve(files);
            }
        });
    });
}
/**
 * [showProgress 上传进度]
 * @param  {[type]} countConf [description]
 * @return {[type]}           [description]
 */
function showProgress(countConf){
    log('[ShowProgress   ] total upload progress ' + ((countConf.success / countConf.total) * 100).toFixed(2) + '%\n');
}

/**
 * [uploadFile 上传文件]
 * @param  {[type]} that            [cos-v5 obj]
 * @param  {[type]} remoteFilePath [description]
 * @param  {[type]} filePath       [description]
 * @return {[type]}                [description]
 */
function uploadFile(that , remoteFilePath , filePath){
    log('[UploadFile   ] bucket: ' + that.bucket + ' region: ' + that.region + '\n');

    var thisMime = '' ; 
    var thisExt = path.extname(remoteFilePath);
    // 优先查找自定义设置
    thisMime = that.mime[thisExt];

    // 如果没有自定义的，且开启默认MIME匹配的
    if(!thisMime && that.mime.default){
        thisMime = mime.lookup(remoteFilePath);
    }
    if(!thisMime){
        thisMime = 'application/octet-stream';
    }
    //上传文件
    return new Promise(function(resolve , reject){
        that.cos.putObject({
            Bucket: that.bucket,
            Region: that.region,
            Key: remoteFilePath,
            Body: fs.createReadStream(filePath),
            ContentLength: fs.statSync(filePath).size,
            CacheControl: 'max-age=' + that.maxAge,
            ContentType : thisMime,
            Expires: that.expires,
            ContentDisposition: 'filename="' + path.basename(remoteFilePath) + '"',
            onProgress: function (progressData) {
                var percent = parseInt(progressData.percent * 10000) / 100;
                var speed = parseInt(progressData.speed / 1024 / 1024 * 100) / 100;
                log('[Uploading  ] ' + filePath +' => progress: ' + percent + '%. speed: ' + speed + ' Mb/s\n');
            }
        }, function (err, data) {
            log('[UploadFile  ] uploaded ' + filePath +' is ' + (err ? 'error\n' : 'success.\n'));
            return err ? reject(err) : resolve(data);
        });
    });
}

/**
 * [traverseUpload 递归上传]
 * @param  {[type]} localPath  [description]
 * @param  {[type]} that      [description]
 * @param  {[type]} files     [description]
 * @param  {[type]} countConf [description]
 * @return {[type]}           [description]
 */
function traverseUpload(localPath , that , files , countConf){
    
    if ( files.length <= 0 ) { //成功
        return Promise.resolve(countConf);
    }

    var file = files.shift();
    var filePath = path.posix.normalize(path.join(localPath , file)); 
    var remoteFilePath = (that.remotePath + file).replace(/\/+/img , '/');

    log('[TraverseUpload   ] will upload file : ' + filePath + ' => ' + remoteFilePath + '\n');

    function catchError(error){
        countConf.fail++;
        countConf.failList.push(file);
        if ( !that.strict ) {
            return Promise.resolve(true);
        }
        return Promise.reject(error);
    }
    function uploaded(data){
        console.log(data);
        countConf.success ++;
        countConf.successList.push({
            sourceUrl: data.Location,
            remotePath: remoteFilePath,
            filePath: filePath
        });
    }
    return  uploadFile(that , remoteFilePath , filePath)
        .then(uploaded , catchError)
        .then(function(){
            that.progress(countConf);
            return traverseUpload(localPath , that , files , countConf);
        });
}


/**
 * [CosV5 腾讯云批量上传v5版本]
 * @param {[type]} config [description]
 */
function CosV5(config){
    if ( !(this instanceof CosV5 )) {
        return new CosV5(config);
    }
    if ( !config.remotePath || !config.bucket || !config.region ) {
        return log('[CosV5   ] params remotePath|| bucket || region is undefined.\n');
    }
    //cos
    this.cos = new COS({SecretId: config.secretId , SecretKey: config.secretKey});
    this.region = config.region;
    this.remotePath = config.remotePath;
    this.bucket = config.bucket;
    this.strict = 'strict' in config ? !!config.strict : true;
    this.maxAge = config.maxAge || 0;
    this.mime = config.mime || {default: true};
    this.expires =  config.expires;
    this.progress  = config.progress || showProgress;
}

/**
 * [setBrowserLog 设置关闭浏览器端的打印log]
 * @param {[type]} show [description]
 */
CosV5.setBrowserLog = function(show){
    if ( !isNodeEnv() ) {
        log = show ? getLog() : function(){};
    }
};

/**
 * [sync 同步上传接口]
 * @param  {[type]}   localPath [description]
 * @param  {[type]}   config   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
CosV5.prototype.sync = function(localPath , config , callback) {
    log('[Sync   ] starting cos-v5...\n');
    var startTime = +new Date();
    if ( typeof config === 'function' ){
        callback = config;
        config = {};
    }
    var defaultCallBack = function(err){
        log('\n[cossync] v5 running time : ' + ((+new Date() - startTime) / 1000) + 's');
        if (err) { 
            return log(err);
        }
    };

    if ( typeof callback !== 'function' ){
        callback = defaultCallBack;
    }
    
    localPath = path.normalize(localPath);

    return traverseAllFiles(localPath , config || {})
        .then(this.upload.bind(this , localPath))
        .then(function(result){
            log('\n[cossync] v5 running time : ' + ((+new Date() - startTime) / 1000) + 's\n');
            log('----------------------------------------\n');
            log(' total:' + result.total + '\n success: ' + result.success + '\n fail: ' + result.fail + '\n');
            log('----------------------------------------\n');
            log('[Sync   ] uploaded.\n');
            return callback(undefined , result);
        } , callback);
};

/**
 * [upload 文件上传接口]
 * @param  {[type]} localPath [description]
 * @param  {[type]} files    [description]
 * @return {[type]}          [description]
 */
CosV5.prototype.upload = function(localPath , files){
    var countConf = {total: files.length || 0 , success:0 , fail:0 , successList:[] , failList:[]}; 
    return traverseUpload(localPath , this , files , countConf);
}

//默认关闭浏览器日志打印
CosV5.setBrowserLog(false);
module.exports = CosV5;