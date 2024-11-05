#!/bin/bash

# Mac/Linux 路径
OUTPUT_PATH="$HOME/Documents/unpack-wxapkg-output"

if [ ! -d "$OUTPUT_PATH" ]; then
    echo "输出目录不存在: $OUTPUT_PATH"
    exit 1
fi

# 删除目录下的所有文件和文件夹
rm -rf "$OUTPUT_PATH"/*

echo "输出目录清理完成" 