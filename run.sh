#!/bin/bash
echo "开始运行微信小程序解包工具..."
node index.js "$@"
echo
echo "程序执行完毕，按任意键退出..."
read -n 1 -s -r -p ""
