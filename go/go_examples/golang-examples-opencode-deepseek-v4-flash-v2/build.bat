@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

set BUILD_DIR=build
if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"

echo ====================================
echo  编译所有 Go 示例代码
echo ====================================
echo.

for /R . %%F in (*.go) do (
    set "FILE=%%F"
    set "NAME=%%~nF"
    set "EXT=%%~xF"
    set "IS_TEST=0"

    echo !NAME! | findstr /R "_test$" >nul
    if !errorlevel! equ 0 set "IS_TEST=1"

    if !IS_TEST! equ 0 (
        echo [编译] %%F
        go build -o "%BUILD_DIR%\!NAME!.exe" "%%F"
        if !errorlevel! neq 0 (
            echo [失败] %%F
            exit /b 1
        ) else (
            echo [成功] 输出: %BUILD_DIR%\!NAME!.exe
        )
        echo.
    )
)

echo ====================================
echo  编译完成！所有示例已编译成功
echo  可执行文件位于 %BUILD_DIR%\ 目录
echo ====================================
