# 腾讯云COS同步（批量上传）工具

## 安装

```sh
npm install -g cossync
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
	"cacheMaxAge":31536000,
	"mime":{
		"default": true,
		".test": "text/plain"
	}
}
```

`remotePath`为COS存储根目录，`localPath`为本地要同步的文件的根目录。`localPath`中的内容将被一一同步到`remotePath`中。

`cacheMaxAge`会设置`cache-control`头为指定的`max-age`值。

`mime`中的`default`表示是否让cossync模块根据后缀名解析MIME（使用`mime`模块），其它键值表示需要自定义MIME。

## 使用

```sh
cossync conf.json
```

## 历史

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
