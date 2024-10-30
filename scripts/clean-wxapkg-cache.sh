#!/bin/bash

# Mac/Linux 路径
APPLET_PATH="$HOME/Documents/WeChat Files/Applet"

if [ ! -d "$APPLET_PATH" ]; then
    echo "微信小程序目录不存在: $APPLET_PATH"
    exit 1
fi

# 删除所有以wx开头的目录
find "$APPLET_PATH" -type d -name "wx*" -exec rm -rf {} +

echo "微信小程序缓存清理完成"
