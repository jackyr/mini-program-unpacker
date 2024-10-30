@echo off
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo Node.js 已安装，正在安装项目依赖...
    npm install
) else (
    echo 未检测到 Node.js！
    echo 请先安装 Node.js，下载地址：https://nodejs.org/
    pause
    exit /b 1
)
