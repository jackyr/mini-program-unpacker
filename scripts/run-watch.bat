@echo off
chcp 65001 >nul
echo 开始运行微信小程序解包工具(监听模式)...
node "%~dp0run.js" --watch %*
echo.
echo 按 Ctrl+C 停止监听...
pause >nul 