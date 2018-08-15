const CosV3 = require('./lib/cos-v3');
const CosV5 = require('./lib/cos-v5');

//兼容 旧版 new Cossync ，新版只能以函数引入。 后期再做一次不兼容版本升级
CosV3.cossync = function(config){
    if ( config.version === 'v5' ){
        return CosV5(config);
    }
    return CosV3(config);
};

//兼容旧版，依然暴露COS V3 版本
module.exports = CosV3;