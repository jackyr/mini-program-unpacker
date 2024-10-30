#!/bin/bash

if command -v node >/dev/null 2>&1; then
    echo "Node.js 已安装，正在安装项目依赖..."
    npm install
else
    echo "未检测到 Node.js！"
    echo "请先安装 Node.js，下载地址：https://nodejs.org/"
    exit 1
fi 