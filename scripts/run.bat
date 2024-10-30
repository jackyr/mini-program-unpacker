@echo off
chcp 65001 >nul
echo 开始运行微信小程序解包工具...
node "%~dp0run.js" %*
echo.
echo 程序执行完毕，按任意键退出...
pause >nul
