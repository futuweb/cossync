# 腾讯云COS同步（批量上传）工具

## 安装

cmd:

```sh
npm install -g cossync
```

require:

```sh
npm install --save cossync
```

## 配置

准备一个配置文件，例如`conf.json`：

```json
{
    "appId":"100012345",
    "secretId":"ABCDABCDABCDABCDABCDABCD",
    "secretKey":"abcdabcdabcd",
    "expired":1800,
    "bucket":"bucketName",
    "remotePath":"/test/",
    "localPath":"./",
    "maxAge":31536000,
    "strict":true , 
    "timeout":30,
    "mime":{
        "default": true,
        ".test": "text/plain"
    }
}
```

## params

* `remotePath` 为COS存储根目录，
* `expired`  密钥有效期
* `strict` 单个文件报错是否停止上传 true or false  default : true
* `localPath` 为本地要同步的文件的根目录。`localPath`中的内容将被一一同步到`remotePath`中。仅`cmd`模式有效。
* `remotePath` 腾讯cos目录 , 以`/`开头和结尾 。例如：`/test/`.
* `maxAge` 会设置`cache-control`头为指定的`max-age`值。
* `mime` 中的`default`表示是否让cossync模块根据后缀名解析MIME（使用`mime`模块），其它键值表示需要自定义MIME。
* `timeout` 连接超时时间 s
* `progress` 查看上传进度函数，可自己配置，挂载在`Cossync`实例上。

## cos.async(localPath [,mimeConf [,maxAge[,callback]]]) 

##cos.sync(localPath [,mimeConf [,maxAge[,callback]]])
`sync`和`async`都是上传文件对外接口。接口完全相同。

*  `localPath` [\<String\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String) 本地上传的文件目录 必须存在
*  `mimeConf` [\<Object\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object) 后缀名 可选
*  `maxAge` [\<Number\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Number) 缓存有效期 可选
*  `callback` [\<Function\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function) 回调函数 可选

`callback(err,result)`，如果上传失败`result`参数为空，`err`为`Error`实例；成功，`err === undefined` ， `result`参数会返回相应的上传状态。

`result`参数如下：

```js
   {   
        code: 0,
        files:
        [ 'demo_001.html',
          'demo_002.html',
          'demo_003.html' 
        ],
        localPath: 'E:/source/2016_11/4/demo/',
        remotePath: '/test/',
        bucket: 'bug',
        count: { 
            total: 3, 
            success: 3, 
            fail: 0 
        }
   }
```

## Cossync
文件上传对象

### Cossync.setWindowsLog(false|true)
默认关闭浏览器日志打印.

## CMD使用模式

```sh
cossync conf.json
```

## require模式

```js
 'use strict';

 var Cossync = require('cossync');

 var cos = new Cossync({
     "appId":"100012345",
    "secretId":"ABCDABCDABCDABCDABCDABCD",
    "secretKey":"abcdabcdabcd",
    "expired":1800,
    "bucket":"bug",
    "maxAge":60,
    "timeout":100,
    "strict":true,
    "remotePath":"/test/",
    "progress" : function(countConf){} 
 });
//cos.async === cos.sync
 cos.sync('E:/source/2016_11/4/demo/' , {"default": true" ,.test": "text/plain"} , 60 , function(err , result){
    console.log(err , result);
 });
```

## 历史

### 2.0.0 2016-12-30

- 增加上传进度
- 增加连接超时设置
- 增加单个文件报错是否停止上传
- 兼容浏览器日志打印，完善日志打印

### 1.2.0 2016-11-08

- 增加出错时3次重试
- 出错时退出返回码改为`1`

### 1.1.0 2016-09-07

- `root`变更为`remotePath`
- 增加`localPath`选项设置本地目录
- 增加缓存头控制选项`cacheMaxAge`
- 增加MIME配置项`mime`
- 规整控制台输出

### 1.0.1 2016-09-04

- 修复命令行无法使用的问题

### 1.0.0 2016-09-04

- 基本功能实现
