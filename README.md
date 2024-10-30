# mini-program-unpacker

## 安装方法

```bash
npm install
```

## 使用方法

```bash
# windows
scripts/run.bat

# linux/mac
sh scripts/run.sh

# 命令行调用
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
