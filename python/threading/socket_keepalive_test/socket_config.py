# -*- coding:utf-8 -*-

"""
@Author:        hogan.chen@ymail.com
@Create Date:   2019-06-18
@Update Date:   2019-06-18
@Version:       V0.9.20190618
"""

import os
import re
import time
import logging
import datetime


# debug flag
DEBUG_MODE_FLAG = True

TEST_LOG_DIR = '.\\logs'
TEST_LOG_SUFFIX = '.log'
TEST_CONSOLE_OUTPUT_DIR = '.\\console_logs'
TEST_CONSOLE_OUTPUT_FILE_NAME = 'console'
TEST_LOG_ARCHIVE_PATH = '.\\archive_logs'
TEST_LOG_MAX_ARCHIVE_NUM = 600
TEST_LOG_MAX_TIME_INTERVAL = 12 * 60

SOCKET_SERVER_ADDRESS = '127.0.0.1'
SOCKET_SERVER_PORT = 8000
SOCKET_RECEIVE_BUFFER = 1024
SOCKET_MAX_CLIENT_NUM = 200
SOCKET_TIMEOUT = 60

TEST_ENV = {
}


# log level
LOGGING_LEVEL = logging.INFO


def logging_config(logging_level):
    # log_format = "%(asctime)s - %(levelname)s - %(message)s"
    # log_format = "%(asctime)s [line: %(lineno)d] - %(levelname)s - %(message)s"
    log_format = "[%(asctime)s - [File: %(filename)s line: %(lineno)d] - %(levelname)s]: %(message)s"
    logging.basicConfig(level=logging_level, format=log_format)


def set_test_env(args_param=None):
    global SOCKET_SERVER_PORT, TEST_LOG_MAX_TIME_INTERVAL

    SOCKET_SERVER_PORT = int(args_param.server_port)
    TEST_LOG_MAX_TIME_INTERVAL = int(args_param.time_interval)


def get_all_files_with_suffix(dir_path, suffix=None):
    log_file_path_list = []

    if os.path.exists(dir_path) and os.path.isdir(dir_path):
        file_list = os.listdir(dir_path)

        for file in file_list:
            file_path = os.path.join(dir_path, file)

            if os.path.isdir(file_path):
                continue
                # not support recursion getting
                # get_all_files_with_suffix(file_path, suffix)
            else:
                if suffix is None:
                    log_file_path_list.append(file_path)
                else:
                    if re.search(r'{}$'.format(re.escape(suffix)), os.path.split(file_path)[1]):
                        log_file_path_list.append(file_path)
                    """
                     if -1 != os.path.split(file_path)[1].find(r'{}'.format(suffix)):
                        log_file_path_list.append(file_path)
                   """
                """
                if suffix is None:
                    log_file_path_list.append(file_path)
                else:
                    # suffix = ['log', 'xml']
                    if isinstance(suffix, list) or isinstance(suffix, tuple):
                        if os.path.splitext(os.path.split(file_path)[1])[1][1:] in suffix:
                            log_file_path_list.append(file_path)
                    elif isinstance(suffix, str):
                        # suffix = '*.log'
                        # if '*.' in suffix:  # abc*.log will match this condition
                        if 0 == suffix.find(r'*.'):
                            if fnmatch.fnmatch(file_path, suffix):
                                log_file_path_list.append(file_path)
                        else:
                            # abc*d.log ==> log
                            suffix = re.sub(r'^.*\.', '', suffix)
                            if os.path.splitext(os.path.split(file_path)[1])[1][1:] == suffix:
                                log_file_path_list.append(file_path)
                """

    logging.debug('Log File list: {}'.format(log_file_path_list))
    return log_file_path_list


def main():
    logging_config(LOGGING_LEVEL)


if __name__ == "__main__":
    print("Script start execution at {}".format(str(datetime.datetime.now())))

    time_start = time.time()
    main()

    print("\n\nTotal Elapsed Time: {} seconds".format(time.time() - time_start))
    print("\nScript end execution at {}".format(datetime.datetime.now()))
