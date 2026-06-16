@echo off
REM ============================================
REM 编译所有 Rust 示例代码 (Windows)
REM ============================================

echo 开始编译 Rust 示例代码...

REM 创建输出目录
if not exist "bin" mkdir bin

REM 编译每个示例
for /d %%d in (*) do (
    echo 编译 %%d 目录...
    for %%f in (%%d\*.rs) do (
        echo   编译 %%f
        rustc "%%f" -o "bin\%%~nf.exe" 2>nul
        if errorlevel 1 (
            echo     编译失败: %%f
        ) else (
            echo     编译成功: %%~nf.exe
        )
    )
)

echo.
echo 编译完成!
echo 可执行文件位于 bin 目录
echo.
pause
