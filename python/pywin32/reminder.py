# -*- coding:utf-8 -*-
"""
@Author:        hogan.chen@ymail.com
@Create Date:   2020-10-02
"""

import os
import re
import time
import yaml
import logging
import datetime
import win32gui
import win32api
import win32con
import pyautogui
import threading
import subprocess

SHUTDOWN_TIME = 5
FILE_BUFFER_SIZE = 50
LOG_FILE_NAME = 'history.log'
CONFIG_FILE_NAME = 'config.ini'

# log level
LOGGING_LEVEL = logging.INFO


def logging_config(logging_level):
    # log_format = "%(asctime)s - %(levelname)s - %(message)s"
    # log_format = "%(asctime)s [line: %(lineno)d] - %(levelname)s - %(message)s"
    # log_format = "[File: %(filename)s line: %(lineno)d] - %(levelname)s - %(message)s"
    # log_format = "[%(asctime)s - [File: %(filename)s line: %(lineno)d] - %(levelname)s]: %(message)s"

    # log_format = "[Datetime: %(asctime)s -- Line: %(lineno)d -- Level: %(levelname)s]: %(message)s"
    # log_format = "[Time: %(asctime)s -- Func: %(funcName)s -- Line: %(lineno)d -- Level: %(levelname)s]: %(message)s"
    log_format = "[Func: %(funcName)s - Line: %(lineno)d - Level: %(levelname)s]: %(message)s"
    logging.basicConfig(level=logging_level, format=log_format)


def get_config_file_mtime(config_file):
    stat_info = os.stat(config_file)
    return stat_info.st_mtime


def check_period(period):
    today_pass_min = datetime.datetime.now().hour * 60 + datetime.datetime.now().minute

    for per_tuple in period:
        logging.debug('per_tuple: {}'.format(per_tuple))
        if per_tuple[0] < today_pass_min < per_tuple[1]:
            logging.debug('today_pass_min: {}, per_tuple: {}'.format(today_pass_min, per_tuple))
            return True

    return False


def get_config(config_file):
    config_dict = {
        'name': '哼', time: 10, 'count': 3,
        'keyword': ('漫画', '小说', '第.*?章', '第.*?回'),
        'remind_msg': '你又在看小说、漫画，玩游戏，没事干了啊？？？\n\n点击确认按钮后，关闭当前页面...',
        'warn_msg': '已达到最大警告次数，电脑关机中...'
    }

    if os.path.exists(config_file):
        with open(config_file, encoding='utf-8') as conf_fd:
            json_dict = yaml.load(conf_fd)

            if json_dict.get('name') is not None:
                config_dict['name'] = json_dict.get('name')

            if json_dict.get('time') is not None:
                config_dict['time'] = json_dict.get('time')

            if json_dict.get('count') is not None:
                config_dict['count'] = json_dict.get('count')

            if json_dict.get('period') is not None:
                config_dict['period'] = json_dict.get('period')

            if json_dict.get('keyword') is not None:
                config_dict['keyword'] = json_dict.get('keyword')

            if json_dict.get('remind_msg') is not None:
                config_dict['remind_msg'] = json_dict.get('remind_msg')

            if json_dict.get('warn_msg') is not None:
                config_dict['warn_msg'] = json_dict.get('warn_msg')

    logging.debug('config_dict: {}'.format(config_dict))
    return config_dict


def show_message_box(hwnd, msg):
    win32api.MessageBox(hwnd, msg, "MessageBox", win32con.MB_OK | win32con.MB_ICONWARNING)


# http://timgolden.me.uk/pywin32-docs/
# https://www.cnblogs.com/liming19680104/p/11988565.html
def main():
    warning_count = 0

    config_dict = get_config(CONFIG_FILE_NAME)
    latest_config_mtime = get_config_file_mtime(CONFIG_FILE_NAME)

    while True:
        config_mtime = get_config_file_mtime(CONFIG_FILE_NAME)
        if config_mtime > latest_config_mtime:
            config_dict = get_config(CONFIG_FILE_NAME)
            latest_config_mtime = config_mtime

        if not check_period(config_dict['period']):
            time.sleep(60)
        else:
            hwnd = win32gui.GetForegroundWindow()
            title = win32gui.GetWindowText(hwnd)
            logging.info('title: {}'.format(title))

            for keyword in config_dict['keyword']:
                if re.search(r'{}'.format(keyword), title):
                    pyautogui.screenshot('{}.png'.format(datetime.datetime.now().strftime('%Y%m%d_%H%M%S')))

                    if warning_count < config_dict['count']:
                        msg = '{}，{}'.format(config_dict['name'], '\n\n'.join(config_dict['remind_msg']))
                        t = threading.Thread(target=show_message_box, args=(hwnd, msg))
                        t.start()
                    else:
                        msg = config_dict['warn_msg']
                        t = threading.Thread(target=show_message_box, args=(hwnd, msg))
                        t.start()
                        time.sleep(SHUTDOWN_TIME)
                        subprocess.run('shutdown -s -f -t 2')

                    warning_count += 1

            time.sleep(config_dict['time'])


def debug():
    config_dict = get_config(CONFIG_FILE_NAME)
    print('period check result: {}'.format(check_period(config_dict['period'])))


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()
    # debug()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
