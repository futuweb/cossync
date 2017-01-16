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

## CLI配置

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

配置项说明：

* `bucket` COS bucket名称
* `expired` 密钥有效期，单位s
* `strict` 单个文件出错是否停止上传，默认值`true`
* `localPath` 为本地要同步的文件的根目录。`localPath`中的内容将被一一同步到`remotePath`中
* `remotePath` 腾讯COS存储根目录，以`/`开头和结尾 。例如：`/test/`。目前只支持一级
* `maxAge` 设置`cache-control`头为指定的`max-age`值
* `mime` 中的`default`表示是否让cossync模块根据后缀名解析MIME（使用`mime`模块），其它键值表示需要自定义MIME
* `timeout` 连接超时时间，单位s

## CLI使用

```sh
cossync conf.json
```

## 模块API

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

`progress(data)`参数：

* `data.success` 成功文件个数
* `data.fail` 失败文件个数
* `data.total` 总文件个数

### Cossync.setBrowserLog(false|true)

静态方法，浏览器环境中（如electron）是否开户浏览器日志输出。默认关闭。

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

实例：

```javascript
cos.sync('E:/source/2016_11/4/demo/' , {"default": true" ,.test": "text/plain"} , 60 , function(err , result){
    console.log(err , result);
});
```

## 历史

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
