const CosV3 = require('./lib/cos-v3');
const CosV5 = require('./lib/cos-v5');

CosV3.cossync = function(config){
    if ( config.version === 'v5' ){
        return CosV5(config);
    }
    return CosV3(config);
};

module.exports = CosV3;