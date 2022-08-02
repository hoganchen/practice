@echo off
REM @echo off表示执行了这条命令后关闭所有命令(包括本身这条命令)的回显。而echo off命令则表示关闭其他所有命令(不包括本身这条命令)的回显，@的作用就是关闭紧跟其后的一条命令的回显

set PATH=C:\Anaconda3;C:\ProgramData\Anaconda3;%PATH%;

python -u utility_01.py

if %errorlevel% == 0 (
    REM 此处存在Bug，python脚本执行完后，批处理并未执行完成，会继续执行下面的REM语句(REM是批处理命令)，从而导致run.bat的返回值为0，所以此处应加上exit()语句，直接退出
    python -u utility_02.py
    exit()
) else (
    exit(1)
)


REM REM 以下语句是获取了python脚本的执行打印，而不是脚本的退出状态值(return code)，不满足需求
REM for /f "delims=" %%a in ('python -u utility_01.py') do (
REM     set ret=%%a
REM )
REM
REM echo %ret%
REM
REM REM 以下语句是数值比较，如果是字符串比较，应该使用 if "%ret%" == "0" 语句
REM if %ret% == 0  (
REM     python -u utility_02.py
REM ) else (
REM     exit(1)
REM )
