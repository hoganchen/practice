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
import shutil
import psutil
import logging
import logging.handlers
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
LOG_FILE_SIZE = 10  # M size
CONFIG_FILE_NAME = 'config.ini'
DATA_CAPTURE_PATH = '.\\data'
SCREEN_CAPTURE_PATH = '.\\screen'

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
    # https://blog.csdn.net/sinat_42483341/article/details/103464691
    # log文件的编码为open的默认值，会导致部分中文乱码
    # logging.basicConfig(filename='{}.log'.format(datetime.datetime.now().strftime('%Y%m%d_%H%M%S')),
    #                     level=logging_level, format=log_format)
    # log文件输出
    # file_handler = logging.FileHandler(filename='{}.log'.format(datetime.datetime.now().strftime('%Y%m%d_%H%M%S')),
    #                                    encoding='utf-8')
    # 滚动文件输出
    rotating_handler = logging.handlers.RotatingFileHandler(filename='reminder.log', maxBytes=LOG_FILE_SIZE*1024*1024,
                                                            backupCount=5, encoding='utf-8')

    logging.basicConfig(handlers={rotating_handler}, level=logging_level, format=log_format)


def check_folder(folder_path):
    if os.path.exists(folder_path):
        if not os.path.isdir(folder_path):
            try:
                os.remove(folder_path)
                os.makedirs(folder_path)
            finally:
                pass
    else:
        try:
            os.makedirs(folder_path)
        finally:
            pass


def get_today_path(parent_folder):
    today_date_str = datetime.date.today().strftime("%Y%m%d")
    today_path = os.path.join(parent_folder, today_date_str)

    if not os.path.exists(today_path):
        os.makedirs(today_path)
    else:
        if os.path.isfile(today_path):
            os.remove(today_path)
            os.makedirs(today_path)

    return today_path


def remove_hist_data(parent_path, max_number, folder_flag=True):
    file_path_list = []

    file_lists = os.listdir(parent_path)

    for filename in file_lists:
        file_path = os.path.join(parent_path, filename)

        if folder_flag:
            if os.path.isdir(file_path):
                file_path_list.append(file_path)
                # if re.match(r'^\d{8}$', os.path.basename(file_path)) is not None:
                #     file_path_list.append(file_path)
        else:
            if os.path.isfile(file_path):
                file_path_list.append(file_path)

    logging.debug('file_path_list: {}'.format(file_path_list))

    if len(file_path_list) > max_number:
        file_path_list.sort(key=lambda fn: os.path.getmtime(fn))

        for file_path in file_path_list[:0 - max_number]:
            try:
                if folder_flag:
                    logging.info('remove folder {} ...'.format(file_path))
                    shutil.rmtree(file_path)
                else:
                    logging.info('remove file {} ...'.format(file_path))
                    os.remove(file_path)
            except Exception as err:
                logging.exception('err: {}'.format(err))


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
        'name': '哼', 'time': 10, 'count': 3, 'interval': 60, 'data': 200, 'history': 5,
        'keyword': ('游戏', 'game', '漫画', '小说', '书架', '第\S*章', '第\S*节', '第\S*回', '第\S*番',
                    '视频', '电影', '电视剧', '爱奇艺', '优酷', '知乎', 'bilibili'),
        'remind_msg': '你能增强你的自控力，做正确的事吗？？？\n\n点击确认按钮后，关闭当前页面...',
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

            # 保存data数据的个数
            if json_dict.get('data') is not None:
                config_dict['data'] = json_dict.get('data')

            # 保存history数据天数
            if json_dict.get('history') is not None:
                config_dict['history'] = json_dict.get('history')

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

    check_folder(DATA_CAPTURE_PATH)
    check_folder(SCREEN_CAPTURE_PATH)

    warning_count = 0
    screen_flag = True
    screen_time = time.time()

    config_dict = get_config(CONFIG_FILE_NAME)
    latest_config_mtime = get_config_file_mtime(CONFIG_FILE_NAME)

    while True:
        try:
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

                try:
                    pid = win32process.GetWindowThreadProcessId(hwnd)
                    logging.info('process name: {}, process title: {}'.format(psutil.Process(pid[-1]).name(), title))
                except Exception as err:
                    logging.info('err: {}'.format(err))
                    logging.info('process title: {}'.format(title))

                for keyword in config_dict['keyword']:
                    if re.search(r'{}'.format(keyword), title):
                        pyautogui.screenshot(os.path.join(DATA_CAPTURE_PATH, '{}.png'.format(
                            datetime.datetime.now().strftime('%Y%m%d_%H%M%S'))))

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
                        break

                time.sleep(config_dict['time'])

            if time.time() - screen_time > config_dict['interval']:
                today_path = get_today_path(SCREEN_CAPTURE_PATH)
                pyautogui.screenshot(os.path.join(today_path, 'screen_{}.png'.format(
                    datetime.datetime.now().strftime('%Y%m%d_%H%M%S'))))

                remove_hist_data(DATA_CAPTURE_PATH, config_dict['data'], folder_flag=False)
                remove_hist_data(SCREEN_CAPTURE_PATH, config_dict['history'])

                screen_flag = True
        except Exception as err:
            logging.exception('err: {}'.format(err))


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
