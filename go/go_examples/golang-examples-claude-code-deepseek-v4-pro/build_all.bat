@echo off
REM ============================================================
REM Go 示例代码批量编译脚本（Windows）
REM 编译所有目录下的 Go 示例代码
REM 依赖 Go 1.21+ 环境
REM ============================================================

echo ========================================
echo   Go 语言示例 - 批量编译脚本
echo ========================================
echo.

REM 检查 go 命令
where go >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未找到 go 命令，请先安装 Go
    exit /b 1
)

echo Go 版本:
go version
echo.

set DIRS=01_hello_basics 02_control_flow 03_functions 04_collections 05_structs_interfaces 06_pointers 07_error_handling 08_concurrency 09_file_io 10_time 11_context 12_testing 13_networking 14_reflection 15_modules 16_go125_new_features 17_structured_logging
set SUCCESS=0
set FAILED=0

if not exist build mkdir build

for %%d in (%DIRS%) do (
    echo [编译] %%d
    cd %%d 2>nul
    if errorlevel 1 (
        echo   [跳过] 目录不存在: %%d
    ) else (
        if "%%d"=="15_modules" (
            go build -o ..\build\%%d.exe . 2>..\build_errors.log
            if errorlevel 1 (
                echo   [失败] %%d
                type ..\build_errors.log
                set /a FAILED+=1
            ) else (
                echo   [成功] %%d -^> build\%%d.exe
                set /a SUCCESS+=1
            )
        ) else if "%%d"=="12_testing" (
            echo   [跳过] 测试目录，请运行: go test ./%%d/
        ) else if "%%d"=="16_go125_new_features" (
            REM Go 1.25 新特性目录，逐个编译（部分需要 Go 1.25+）
            for %%f in (*.go) do (
                if not "%%f"=="02_synctest_basic.go" (
                    go build -o ..\build\%%~nf.exe %%f 2>..\build_errors.log
                    if errorlevel 1 (
                        echo   [失败] %%~nf (可能需要 Go 1.25+)
                        type ..\build_errors.log
                        set /a FAILED+=1
                    ) else (
                        echo   [成功] %%f -^> %%~nf.exe
                        set /a SUCCESS+=1
                    )
                )
            )
        ) else if "%%d"=="17_structured_logging" (
            for %%f in (*.go) do (
                go build -o ..\build\%%~nf.exe %%f 2>..\build_errors.log
                if errorlevel 1 (
                    echo   [失败] %%~nf
                    type ..\build_errors.log
                    set /a FAILED+=1
                ) else (
                    echo   [成功] %%f -^> %%~nf.exe
                    set /a SUCCESS+=1
                )
            )
        ) else (
            for %%f in (*.go) do (
                go build -o ..\build\%%~nf.exe %%f 2>..\build_errors.log
                if errorlevel 1 (
                    echo   [失败] %%~nf
                    type ..\build_errors.log
                    set /a FAILED+=1
                ) else (
                    echo   [成功] %%f -^> %%~nf.exe
                    set /a SUCCESS+=1
                )
            )
        )
        cd ..
    )
)

echo.
echo ========================================
echo  编译完成: 成功 %SUCCESS% 个, 失败 %FAILED% 个
echo ========================================
echo.
echo 推荐逐个目录手动编译：
echo   cd 目录名
echo   go run 文件名.go
echo.
echo 测试目录：
echo   go test -v ./12_testing/
echo   go test -v ./16_go125_new_features/ -run TestSynctest

REM 清理
if exist build_errors.log del build_errors.log
