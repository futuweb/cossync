# 腾讯云COS （V3，V5 BUCKET）文件夹同步（批量上传）工具
支持V3，V5版本的bucket。

腾讯云文档： [https://cloud.tencent.com/document/product/436/12264](https://cloud.tencent.com/document/product/436/12264)

## 安装

cmd:

```sh
npm install -g cossync
```

require:

```sh
npm install --save cossync
```

## CLI配置

准备一个配置文件，例如`conf.json`：

```json
// V3 BUCKET
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

//v5 bucket
{
    "secretId":"SGFDDGHFGFHHSEREWTRETRETER",
    "secretKey":"FGHGFHGFHGFHAASRETRET",
    "bucket":"testname-12500000",
    "strict":true,
    "version":"v5",
    "region":"na-ashburn",
    "remotePath":"/test/",
    "localPath": "./test",
    "maxAge":31536000, //cache-control
    "expires": 300, //content -expries
    "timeout": 120000, // 单个文件上传超时时间，单位为ms
    "mime":{  //content-type
        "default": true,
        ".test": "text/plain"
    },
    "globConfig":{
      "ignore":["node_modules/**"],
      "nodir":true
    }
}
```

V3 BUCKET配置项说明：

* `bucket` COS bucket名称
* `expired` 密钥有效期，单位s
* `strict` 单个文件出错是否停止上传，默认值`true`
* `localPath` 为本地要同步的文件的根目录。`localPath`中的内容将被一一同步到`remotePath`中
* `remotePath` 腾讯COS存储根目录，以`/`开头和结尾 。例如：`/test/`。目前只支持一级
* `maxAge` 设置`cache-control`头为指定的`max-age`值
* `mime` 中的`default`表示是否让cossync模块根据后缀名解析MIME（使用`mime`模块），其它键值表示需要自定义MIME
* `timeout` 连接超时时间，单位s


V5 BUCKET 特殊配置项说明：

* `bucket` 格式为 {bucket}-{appid}
* `version` 指定使用的cos版本。 目前只有： `v3` 和 `v5`。
* `region`  表示bucket的所属地域。
* `globConfig`  参考[node-glob](https://github.com/isaacs/node-glob) 。 主要用于配置筛选上传文件。
* `timeout` 连接超时时间，单位ms，默认为120000ms

## CLI使用
如果没有指定使用的配置文件，将在`proccess.cwd()`目录下寻找`cossyncconf.json`文件。

```sh
cossync conf.json
```

## V5 模块API

### `Cossync(options)`

构建函数，返回`Cossync`实例。

参数：

* `options`参数对象
    * `secretId` COS  secretId
    * `secretKey` COS secretKey
    * `bucket` COS {bucket}-{appid}
    * `strict` 单个文件出错是否停止上传，默认值`true`
    * `remotePath` 腾讯COS存储根目录，以`/`开头和结尾 。例如：`/test/`。目前只支持一级
    * `progress` 上传进度回调函数
    * `timeout` 单个文件超时时间，默认值`120000`ms


`progress(data)`参数：

* `data.success` 成功文件个数
* `data.fail` 失败文件个数
* `data.total` 总文件个数
* `data.successList`  成功列表
* `data.failList`  失败列表

### Cossync#sync(localPath [,globConfig [,callback]])
实例方法，收集上传文件并上传文件接口。

### Cossync#upload(localPath , files)
上传文件接口。


### V5 bucket 案例

```js
var cossync = require('cossync').cossync;

var conf = {
    secretId:'DGFDFGDFGDFGDF',
    secretKey:'DFGDFGDFGDFGDFGDFDFGDFG',
    bucket:'ertretretr-12500000',
    strict:true,
    version:'v5',
    region:'na-ashburn',
    remotePath:'/test/',
    localPath: '/data',
    timeout: 120000, // 单个文件上传超时时间，单位毫秒，默认为2分钟
    maxAge:31536000, //cache-control
    expires: 300, //content -expries
    mime:{  //content-type
        default: true,
        ".test": "text/plain"
    },
    globConfig:{
      ignore:["node_modules/**"],
      nodir:true
    }
};

var cos = cossync(conf);

cos.sync(conf.localPath , conf.globConfig , function(err , result){
  console.log(err , result);
});
```

返回：

```js
{total: files.length || 0 , success:0 , fail:0 , successList:[] , failList:[]};
```

## V3 模块API

### `Cossync(options)`

构建函数，返回`Cossync`实例。

参数：

* `options`参数对象
    * `appId` COS AppId
    * `secretId` COS  secretId
    * `secretKey` COS secretKey
    * `expired` 密钥有效期，单位s
    * `bucket` COS bucket名称
    * `maxAge` 设置`cache-control`头为指定的`max-age`值
    * `timeout` 连接超时时间，单位s
    * `strict` 单个文件出错是否停止上传，默认值`true`
    * `remotePath` 腾讯COS存储根目录，以`/`开头和结尾 。例如：`/test/`。目前只支持一级
    * `progress` 上传进度回调函数
    * `timeout` 单个文件超时时间，单位毫秒，默认为120000ms（2分钟）

`progress(data)`参数：

* `data.success` 成功文件个数
* `data.fail` 失败文件个数
* `data.total` 总文件个数

### Cossync#sync(localPath [,mimeConf [,maxAge[,callback]]])

实例方法，上传文件接口。

*  `localPath` [\<String\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String) 本地上传的文件目录 必须存在
*  `mimeConf` [\<Object\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object) 后缀名，见CLI配置项解释 可选
*  `maxAge` [\<Number\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Number) 缓存有效期 可选
*  `callback` [\<Function\>](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function) 上传结束回调函数 可选

`callback(err, result)`，如果上传失败`result`参数为空，`err`为`Error`实例；成功，`err === undefined` ， `result`参数会返回相应的上传状态。

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

### V3 bucket 案例

```javascript
var cossync = require('cossync').cossync;

var conf = {
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

var cos = cossync(conf);

cos.sync(conf.localPath conf.mime, conf.maxAge || conf.cacheMaxAge || 0, function(err , result){
    console.log(err , result);
});
```

## Cossync.setBrowserLog(false|true)

静态方法，浏览器环境中（如electron）是否开户浏览器日志输出。默认关闭。

## 历史

### 1.5.3 2023-08-08
- 修复V5上传文件名含中文失败的问题

### 1.5.2 2021-01-04

- 去除调试日志

### 1.5.1 2020-05-20

- 修复v5版本log出的速度为NaN的问题，上传数据精确到KB/s

### 1.5.0 2020-02-27

- V5 bucket支持timeout参数，默认为120000ms

### 1.4.3 2019-12-03

- 上传失败时抛出详细异常

### 1.4.0 2018-08-15

- 支持V5 bucket
- 兼容旧版v3 bucket
- 修改引入方式

### 1.3.1 2017-03-27

- 优化callback回调
- 修改=>箭头函数为`function`

### 1.3.0 2017-01-16

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
