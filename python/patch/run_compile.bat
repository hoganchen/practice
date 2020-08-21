@echo off
REM 开启延时变量
setlocal enabledelayedexpansion
REM 关闭延时变量
REM setlocal disabledelayedexpansion

REM set PATH=%PATH%;C:\Anaconda3;C:\ProgramData\Anaconda3
set PATH=%PATH%;.\venv\Scripts

for /L %%i in (1,1,20) do (
    REM 延时变量需要使用!var!的方式使用
    set HOURS=!time: =0!
    set datestr=!date:~0,4!!date:~5,2!!date:~8,2!!HOURS:~0,2!!time:~3,2!!time:~6,2!
    REM echo !datestr!
    REM ping 127.0.0.1 -n 2 > nul

    pyinstaller --clean -F -w -c patch_gen_apply.py
    copy /y dist\patch_gen_apply.exe .\patch_gen_apply_!datestr!.exe
)

REM python -u patch_gen_apply.py -o gen -b SDK_B1234 -n SDK_B4321 > gen_%date:~0,4%%date:~5,2%%date:~8,2%%HOUR:~0,2%%time:~3,2%%time:~6,2%.log 2>&1

pause
