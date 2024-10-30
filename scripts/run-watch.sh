#!/bin/bash
echo "开始运行微信小程序解包工具(监听模式)..."
node "$(dirname "$0")/run.js" --watch "$@"
echo
echo "按 Ctrl+C 停止监听..." 