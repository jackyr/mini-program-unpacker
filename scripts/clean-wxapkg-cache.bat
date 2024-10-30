@echo off
setlocal

:: Windows 路径
set "APPLET_PATH=%USERPROFILE%\Documents\WeChat Files\Applet"

if not exist "%APPLET_PATH%" (
    echo 微信小程序目录不存在: %APPLET_PATH%
    exit /b 1
)

:: 删除所有以wx开头的目录
for /d %%i in ("%APPLET_PATH%\wx*") do (
    rd /s /q "%%i"
)

echo 微信小程序缓存清理完成 