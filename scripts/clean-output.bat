@echo off
setlocal

:: Windows 路径
set "OUTPUT_PATH=%USERPROFILE%\Documents\unpack-wxapkg-output"

if not exist "%OUTPUT_PATH%" (
    echo 输出目录不存在: %OUTPUT_PATH%
    exit /b 1
)

:: 删除目录下的所有文件和文件夹
rd /s /q "%OUTPUT_PATH%"
mkdir "%OUTPUT_PATH%"

echo 输出目录清理完成 