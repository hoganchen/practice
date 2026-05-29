@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo  正在编译所有 Go 示例代码...
echo ========================================
echo.

:: 设置输出目录
set "OUTPUT_DIR=build_output"
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

:: 编译单个文件示例
set COUNT=0
for /r %%f in (*.go) do (
    set "FILE=%%f"
    set "REL=!FILE:%CD%\=!"

    :: 跳过测试文件和包文件
    echo !REL! | findstr /i "_test.go" >nul
    if errorlevel 1 (
        echo !REL! | findstr /i "15_packages" >nul
        if errorlevel 1 (
            echo 编译: !REL!
            set /a COUNT+=1
            
            :: 提取文件名（不含扩展名）作为输出名
            for %%a in ("%%f") do set "NAME=%%~na"
            set "OUTPUT=%OUTPUT_DIR%\!NAME!.exe"
            
            go build -o "!OUTPUT!" "%%f"
            if !errorlevel! neq 0 (
                echo   [失败] !errorlevel!
            ) else (
                echo   [成功] -^> !OUTPUT!
            )
        )
    )
)

echo.
echo ========================================
echo  编译完成！共编译 %COUNT% 个文件
echo  可执行文件在 %OUTPUT_DIR%\ 目录下
echo ========================================

echo.
echo 注意：以下示例需要单独运行：
echo   cd 15_packages ^&^& go mod init examples ^&^& go run main.go
echo   go run 28_net_http\01_http_server.go   (HTTP 服务器)
echo   go test -v ./23_testing/
echo   go test -v -bench=. ./33_testing_advanced/
echo.

pause
