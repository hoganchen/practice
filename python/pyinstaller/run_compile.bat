@echo off
REM 开启延时变量
setlocal enabledelayedexpansion
REM 关闭延时变量
REM setlocal disabledelayedexpansion

REM set PATH=%PATH%;C:\Anaconda3;C:\ProgramData\Anaconda3
REM 更新path变量，指明python解释器的位置
set PATH=%PATH%;.\venv\Scripts

for /L %%i in (1,1,10) do (
    REM 延时变量需要使用!var!的方式使用
    set HOURS=!time: =0!
    set datestr=!date:~0,4!!date:~5,2!!date:~8,2!!HOURS:~0,2!!time:~3,2!!time:~6,2!
    REM echo !datestr!
    REM ping 127.0.0.1 -n 2 > nul

    REM pyinstaller --clean -F -w -c test_main.py
    REM python .\venv\Scripts\pyinstaller-script.py --clean -F -w -c test_main.py -p test_config.py -p test_control.py -p test_cmd.py
    python .\venv\Scripts\pyinstaller-script.py --clean -F -w --version-file version.txt -c test_main.py -p test_config.py -p test_control.py -p test_cmd.py
    copy /y dist\test_main.exe .\test_main_!datestr!.exe
)

pause
