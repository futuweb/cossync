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
	"localPath":"./"
}
```

其中`remotePath`为COS存储根目录，`localPath`为本地要同步的文件的根目录。`localPath`中的内容将被一一同步到`remotePath`中。

## 使用

```sh
cossync conf.json
```

## 历史

### 1.0.1 2016-09-04

- 修复命令行无法使用的问题

### 1.0.0 2016-09-04

- 基本功能实现