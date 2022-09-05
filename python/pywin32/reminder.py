# -*- coding:utf-8 -*-
"""
@Author:        hogan.chen@ymail.com
@Create Date:   2020-10-02
"""

import os
import re
import time
import yaml
import socket
import psutil
import logging
import datetime
import win32gui
import win32api
import win32con
import pyautogui
import threading
import subprocess
import win32process

SHUTDOWN_TIME = 5
CHECK_PERIOD_TIME = 60
CONFIG_FILE_NAME = 'config.ini'

# log level
LOGGING_LEVEL = logging.INFO


def logging_config(logging_level):
    # log_format = "%(asctime)s - %(levelname)s - %(message)s"
    # log_format = "%(asctime)s [line: %(lineno)d] - %(levelname)s - %(message)s"
    # log_format = "[File: %(filename)s line: %(lineno)d] - %(levelname)s - %(message)s"
    # log_format = "[%(asctime)s - [File: %(filename)s line: %(lineno)d] - %(levelname)s]: %(message)s"

    # log_format = "[Func: %(funcName)s - Line: %(lineno)d - Level: %(levelname)s]: %(message)s"
    # log_format = "[Datetime: %(asctime)s -- Line: %(lineno)d -- Level: %(levelname)s]: %(message)s"
    log_format = "[Time: %(asctime)s -- Func: %(funcName)s -- Line: %(lineno)d -- Level: %(levelname)s]: %(message)s"

    # https://docs.python.org/zh-cn/3/howto/logging.html
    # https://blog.csdn.net/qq_41623250/article/details/107575912
    # log文件的编码为open的默认值，会导致部分中文乱码
    # logging.basicConfig(filename='{}.log'.format(datetime.datetime.now().strftime('%Y%m%d_%H%M%S')),
    #                     level=logging_level, format=log_format)
    file_handler = logging.FileHandler(filename='{}.log'.format(datetime.datetime.now().strftime('%Y%m%d_%H%M%S')),
                                       encoding='utf-8')
    logging.basicConfig(handlers={file_handler}, level=logging_level, format=log_format)


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
        'name': '哼', 'time': 10, 'count': 3, 'interval': 60,
        'keyword': ('游戏', 'game', '漫画', '小说', '书架', '第\S*章', '第\S*节', '第\S*回', '第\S*番',
                    '知乎', '视频', '爱奇艺', 'bilibili'),
        'remind_msg': '你又在看小说、漫画，玩游戏，没事干了啊？？？\n\n点击确认按钮后，关闭当前页面...',
        'warn_msg': '已达到最大警告次数，电脑关机中...'
    }

    if os.path.exists(config_file):
        with open(config_file, encoding='utf-8') as conf_fd:
            json_dict = yaml.load(conf_fd)

            if json_dict.get('name') is not None:
                config_dict['name'] = json_dict.get('name')

            # 检查间隔
            if json_dict.get('time') is not None:
                config_dict['time'] = json_dict.get('time')

            # 最大警告次数
            if json_dict.get('count') is not None:
                config_dict['count'] = json_dict.get('count')

            # 检查的时间周期
            if json_dict.get('period') is not None:
                config_dict['period'] = json_dict.get('period')

            # 强制截屏间隔时间
            if json_dict.get('interval') is not None:
                config_dict['interval'] = json_dict.get('interval')

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
    # 只允许运行一个实例
    # https://www.jianshu.com/p/06134ca966de
    try:
        s = socket.socket()
        host = socket.gethostname()
        port = 60123
        s.bind((host, port))
    except Exception as err:
        print('err: {}'.format(err))
        return

    logging_config(LOGGING_LEVEL)

    warning_count = 0
    screen_flag = True
    screen_time = time.time()

    config_dict = get_config(CONFIG_FILE_NAME)
    latest_config_mtime = get_config_file_mtime(CONFIG_FILE_NAME)

    while True:
        if screen_flag:
            screen_time = time.time()
            screen_flag = False

        config_mtime = get_config_file_mtime(CONFIG_FILE_NAME)
        if config_mtime > latest_config_mtime:
            config_dict = get_config(CONFIG_FILE_NAME)
            latest_config_mtime = config_mtime

        if not check_period(config_dict['period']):
            time.sleep(CHECK_PERIOD_TIME)
        else:
            hwnd = win32gui.GetForegroundWindow()
            title = win32gui.GetWindowText(hwnd)
            pid = win32process.GetWindowThreadProcessId(hwnd)
            logging.info('process name: {}, title: {}'.format(psutil.Process(pid[-1]).name(), title))

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

        if time.time() - screen_time > config_dict['interval']:
            pyautogui.screenshot('screen_{}.png'.format(datetime.datetime.now().strftime('%Y%m%d_%H%M%S')))
            screen_flag = True


def debug():
    config_dict = get_config(CONFIG_FILE_NAME)
    print('period check result: {}'.format(check_period(config_dict['period'])))
    print(os.path.basename(__file__))


if __name__ == '__main__':
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()
    # debug()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
