# mini-program-unpacker

## 说明

- 微信小程序解包工具，支持监听目录变动，自动解包。
- 默认输入目录为微信小程序默认缓存目录`~/Documents/WeChat Files/Applet`（仅windows下有效），支持输入wxapkg文件。默认输出目录为`~/Documents/unpack-wxapkg-output`。
-  依赖nodejs >= 18。

## 安装方法

```bash
# windows
scripts/install.bat

# linux/mac
sh scripts/install.sh
```

## 使用方法

```bash
# windows
scripts/run.bat
scripts/run-watch.bat # 监听输入目录变动

# linux/mac
sh scripts/run.sh
sh scripts/run-watch.sh # 监听输入目录变动
```

## 命令行调用

```bash
node scripts/run.js -i ./input -o ./output --wxid wx1234567890abcdef -w
```

## 命令行参数

```bash
Options:
  -i, --input    输入路径(可以是微信小程序目录或wxapkg文件)，默认: "~/Documents/WeChat Files/Applet"
  -o, --output   输出目录路径，默认: "~/Documents/unpack-wxapkg-output"
  --wxid         小程序ID（处理单个文件时可选）
  -w, --watch    监听输入目录变动，默认: false
  --help         显示帮助
```
