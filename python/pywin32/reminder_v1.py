# -*- coding:utf-8 -*-
"""
@Author:        hogan.chen@ymail.com
@Create Date:   2020-10-02
"""

import os
import re
import time
import yaml
import chardet
import logging
import datetime
import win32gui
import win32api
import win32con
import pyautogui
import subprocess

CHECK_PERIOD = 5
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


# https://www.cnblogs.com/zhangchenliang/p/8136958.html
def get_the_last_n_lines(file_name, line_num=1):
    with open(file_name, 'r') as f:  # 打开文件
        # first_line = f.readline()  # 读第一行
        off = -50  # 设置偏移量
        while True:
            '''
            对于以文本格式打开，只允许相对于文件开头搜索（使用 seek(0, 2) 搜索到文件末尾是个例外）
            并且唯一有效的 oﬀset 值是那些能从 f.tell() 中返回的或者是零。
            所以以下代码会报错，仅供参考其思路
            '''
            f.seek(off, 2)  # seek(off, 2)表示文件指针：从文件末尾(2)开始向前50个字符(-50)
            lines = f.readlines()  # 读取文件指针范围内所有行
            if len(lines) >= line_num + 1:  # 判断是否最后至少有两行，这样保证了最后一行是完整的
                last_lines = lines[-line_num:]  # 取最后一行
                break
            # 如果off为50时得到的readlines只有一行内容，那么不能保证最后一行是完整的
            # 所以off翻倍重新运行，直到readlines不止一行
            off *= 2

    return last_lines


# https://thispointer.com/python-get-last-n-lines-of-a-text-file-like-tail-command/
def get_last_n_lines(file_name, line_num=5):
    # Create an empty list to keep the track of last N lines
    list_of_lines = []
    # Open file for reading in binary mode
    with open(file_name, 'rb') as read_obj:
        # Move the cursor to the end of the file
        read_obj.seek(0, os.SEEK_END)
        # Create a buffer to keep the last read line
        buffer = bytearray()
        # Get the current position of pointer i.e eof
        pointer_location = read_obj.tell()
        # Loop till pointer reaches the top of the file
        while pointer_location >= 0:
            # Move the file pointer to the location pointed by pointer_location
            read_obj.seek(pointer_location)
            # Shift pointer location by -1
            pointer_location = pointer_location - 1
            # read that byte / character
            new_byte = read_obj.read(1)
            # If the read byte is new line character then it means one line is read
            if new_byte == b'\n':
                # Save the line in list of lines
                list_of_lines.append(buffer.decode()[::-1])
                # If the size of list reaches line_num, then return the reversed list
                if len(list_of_lines) == line_num:
                    return list(reversed(list_of_lines))
                # Reinitialize the byte array to save next line
                buffer = bytearray()
            else:
                # If last read character is not eol then add it in buffer
                buffer.extend(new_byte)
        # As file is read completely, if there is still data in buffer, then its first line.
        if len(buffer) > 0:
            list_of_lines.append(buffer.decode()[::-1])
    # return the reversed list
    return list(reversed(list_of_lines))


# https://stackoverflow.com/questions/46258499/how-to-read-the-last-line-of-a-file-in-python
def get_last_a_line(file_name):
    with open(file_name, 'rb') as f:
        f.seek(-2, os.SEEK_END)
        while f.read(1) != b'\n':
            f.seek(-2, os.SEEK_CUR)
        last_line = f.readline().decode()

    return last_line


def get_last_n_lines_from_log(file_name, line_num=5):
    data_buffer = None

    with open(file_name, 'rb') as f:
        char_det_result = chardet.detect(f.read())
        logging.debug('filename: {}, char detect result: {}'.format(file_name, char_det_result))

    try:
        r_fd = open(file_name, 'r', encoding=char_det_result['encoding'])
        r_fd.seek(0, 0)
    except Exception as Err:
        logging.critical('Can not open %s file, error info is: %s\n' % (file_name, Err))
    else:
        r_fd.seek(0, 2)
        file_length = r_fd.tell()

        if file_length >= FILE_BUFFER_SIZE:
            r_fd.seek(file_length - FILE_BUFFER_SIZE, 0)
        else:
            r_fd.seek(0, 0)

        data_buffer = r_fd.readlines()

        r_fd.close()

    if len(data_buffer) > line_num:
        data_line = data_buffer[0 - line_num:]
    else:
        data_line = data_buffer

    logging.debug('The len(data_buffer): {}'.format(len(data_buffer)))
    logging.debug('For {}, The last {} line data is: \n{}'.format(file_name, line_num, data_line))

    return data_line


def get_the_last_line(file_name):
    with open(file_name, 'r') as fd:
        '''
        要改变文件对象的位置，请使用 f.seek(offset, whence)。通过向一个参考点添加 oﬀset 来计算位置；
        参考点由 whence 参数指定。whence 的 0 值表示从文件开头起算，1 表示使用当前文件位置，
        2 表示使用文件末尾作为参考点。whence 如果省略则默认值为 0，即使用文件开头作为参考点。
        
        在文本文件（那些在模式字符串中没有 b 的打开的文件）中，
        只允许相对于文件开头搜索（使用 seek(0, 2) 搜索到文件末尾是个例外）
        并且唯一有效的 oﬀset 值是那些能从 f.tell() 中返回的或者是零。其他 oﬀset 值都会产生未定义的行为。
        '''
        fd.seek(0, 2)
        file_length = fd.tell()
        logging.debug('file length: {}'.format(file_length))

        if file_length >= FILE_BUFFER_SIZE:
            fd.seek(file_length - FILE_BUFFER_SIZE, 0)
        else:
            fd.seek(0, 0)

        data_buffer = fd.readlines()

    if len(data_buffer) > 0:
        last_line = data_buffer[-1]
    else:
        last_line = ''

    logging.debug('last_line: {}'.format(last_line))
    return last_line


def get_config_file_mtime(config_file):
    stat_info = os.stat(config_file)
    return stat_info.st_mtime


def save_history_log(count):
    with open(LOG_FILE_NAME, 'a') as log_fd:
        log_fd.write('date: {}, count: {}\n'.format(datetime.datetime.now(), count))


def check_history_log(count):
    last_line = get_the_last_line(LOG_FILE_NAME)

    match_obj = re.search(r'date:\s+(.*?),\s+count:\s+(\d+)', last_line)

    if match_obj:
        last_date = datetime.datetime.strptime(match_obj[1], "%Y-%m-%d %H:%M:%S.%f")
        last_count = int(match_obj[2])

        if datetime.date.today() > last_date.date():
            return False
        else:
            if last_count >= count:
                return True
    else:
        return False


def check_period(period):
    today_pass_min = datetime.datetime.now().hour * 60 + datetime.datetime.now().minute

    for per_tuple in period:
        logging.debug('per_tuple: {}'.format(per_tuple))
        if per_tuple[0] < today_pass_min < per_tuple[1]:
            logging.debug('today_pass_min: {}, per_tuple: {}'.format(today_pass_min, per_tuple))
            return True

    return False


def get_config(config_file):
    config_dict = {'name': '哼', 'count': 3, 'keyword': ('漫画', '小说', '第.*?章', '第.*?回')}

    if os.path.exists(config_file):
        with open(config_file, encoding='utf-8') as conf_fd:
            json_dict = yaml.load(conf_fd)

            if json_dict.get('name') is not None:
                config_dict['name'] = json_dict.get('name')

            if json_dict.get('count') is not None:
                config_dict['count'] = json_dict.get('count')

            if json_dict.get('keyword') is not None:
                config_dict['keyword'] = json_dict.get('keyword')

            if json_dict.get('period') is not None:
                config_dict['period'] = json_dict.get('period')

    logging.debug('config_dict: {}'.format(config_dict))
    return config_dict


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
                    warning_count += 1

                    save_history_log(warning_count)
                    pyautogui.screenshot('{}.png'.format(datetime.datetime.now().strftime('%Y%m%d_%H%M%S')))

                    if warning_count < config_dict['count']:
                        win32api.MessageBox(hwnd, "警告：{}，你又在看小说、漫画，玩游戏，没事干了啊？？？".format(config_dict['name']),
                                            "MessageBox", win32con.MB_OK | win32con.MB_ICONWARNING)
                    else:
                        win32api.MessageBox(hwnd, "已达到最大警告次数，电脑关机中...", "MessageBox",
                                            win32con.MB_OK | win32con.MB_ICONWARNING)
                        # subprocess.run(['ping', '127.0.0.1', '-c', '5'], shell=True)
                        subprocess.run('shutdown -s -f -2')

            time.sleep(CHECK_PERIOD)


def debug():
    config_dict = get_config(CONFIG_FILE_NAME)
    print('period check result: {}'.format(check_period(config_dict['period'])))
    # save_history_log(count=3)
    get_the_last_line(LOG_FILE_NAME)


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()
    # debug()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
