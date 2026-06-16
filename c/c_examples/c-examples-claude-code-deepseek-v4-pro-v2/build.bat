@echo off
setlocal enabledelayedexpansion

REM ========================================
REM  C Examples Build Script - Windows
REM  Compiles all .c files in subdirectories
REM ========================================

set "BASE_DIR=%~dp0"
pushd "%BASE_DIR%"
set SUCCESS_COUNT=0
set FAIL_COUNT=0

echo ========================================
echo  C Examples Build Script - Windows
echo ========================================
echo.

REM ========================================
REM  Step 1: Multi-file project (17_multifile)
REM  Compile main.c + helper.c together
REM ========================================
echo [PROJECT] 17_multifile -- main.c + helper.c
cd 17_multifile
gcc main.c helper.c -o multifile_demo.exe -std=c11 -Wall
if !ERRORLEVEL!==0 (
    echo   [OK] multifile_demo.exe
    set /a SUCCESS_COUNT+=1
) else (
    echo   [FAIL] multifile_demo.exe
    set /a FAIL_COUNT+=1
)
cd "%BASE_DIR%"
echo.

REM ========================================
REM  Step 2: Compile all individual .c files
REM ========================================
for /r %%f in (*.c) do (
    set "SKIP="
    set "FLAGS="

    REM Skip files in the multifile project folder
    echo "%%f" | findstr /I /C:"17_multifile" >nul
    if not errorlevel 1 set "SKIP=1"

    if not defined SKIP (
        set "FILENAME=%%~nxf"
        set "OUTDIR=%%~dpf"

        REM --- Networking files: link with winsock library ---
        echo "%%f" | findstr /I /C:"19_network" >nul
        if not errorlevel 1 set "FLAGS=!FLAGS! -lws2_32"

        REM --- Threading files: link with pthread library ---
        echo "%%f" | findstr /I /C:"18_threading" >nul
        if not errorlevel 1 set "FLAGS=!FLAGS! -lpthread"

        REM --- Math file: link with math library ---
        echo "%%f" | findstr /I /C:"15_standard_library\\02_math_functions" >nul
        if not errorlevel 1 set "FLAGS=!FLAGS! -lm"

        echo [COMPILE] !FILENAME!
        gcc "%%f" -o "!OUTDIR!%%~nf.exe" -std=c11 -Wall !FLAGS!

        if !ERRORLEVEL!==0 (
            echo   [OK] !FILENAME!
            set /a SUCCESS_COUNT+=1
        ) else (
            echo   [FAIL] !FILENAME!
            set /a FAIL_COUNT+=1
        )
        echo.
    )
)

REM ========================================
REM  Summary
REM ========================================
echo ========================================
echo  Build Summary
echo ========================================
echo  Compiled: %SUCCESS_COUNT%
echo  Failed:   %FAIL_COUNT%
echo ========================================

popd

if %FAIL_COUNT% GTR 0 (
    exit /b 1
)
exit /b 0
