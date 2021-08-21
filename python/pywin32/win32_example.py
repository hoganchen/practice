# -*- coding:utf-8 -*-

"""
@Author:        hogan.chen@ymail.com
@Create Date:   2021/8/21
"""

import time
import logging
import datetime
import win32gui
import win32api
import win32con
import subprocess

# log level
LOGGING_LEVEL = logging.INFO


def logging_config(logging_level):
    # log_format = "%(asctime)s - %(levelname)s - %(message)s"
    # log_format = "%(asctime)s [line: %(lineno)d] - %(levelname)s - %(message)s"
    # log_format = "[File: %(filename)s line: %(lineno)d] - %(levelname)s - %(message)s"
    # log_format = "[%(asctime)s - [File: %(filename)s line: %(lineno)d] - %(levelname)s]: %(message)s"
    # log_format = "[Func: %(funcName)s - Line: %(lineno)d - Level: %(levelname)s]: %(message)s"
    # log_format = "[Datetime: %(asctime)s - Line: %(lineno)d - Level: %(levelname)s]: %(message)s"
    # log_format = "[Func: %(funcName)s - Line: %(lineno)d - Level: %(levelname)s]: %(message)s"

    # log_format = "[Time: %(asctime)s - Func: %(funcName)s - Line: %(lineno)d - Level: %(levelname)s]: %(message)s"
    log_format = "[Time: %(asctime)s - Line: %(lineno)d - Level: %(levelname)s]: %(message)s"
    logging.basicConfig(level=logging_level, format=log_format)


def debug():
    subprocess.run('shutdown -s -f -t 2')


def main():
    msg = '哼，你又在看小说、漫画，玩游戏，没事干了啊？？？\n\n点击确认按钮后，关闭对应页面...'
    hwnd = win32gui.GetForegroundWindow()
    win32api.MessageBox(hwnd, msg, "MessageBox", win32con.MB_OK | win32con.MB_ICONWARNING)


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
