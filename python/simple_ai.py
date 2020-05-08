# -*- coding:utf-8 -*-
"""
@Author:        hogan.chen@ymail.com
@Create Date:   2019-04-30
"""
import time
import logging
import datetime

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


def main():
    print("小爱:", "你好，今天想和我聊点什么呢？")

    while True:
        '''
        冒号这是函数参数注解，告诉使用者应该怎样正确使用这个函数。比如：

        def add(x:int, y:int) -> int:
            return x + y
        '''
        chat_str: str = input()
        chat_str = chat_str.replace("吗", "")

        if -1 != chat_str.find("?") or -1 != chat_str.find("？"):
            chat_str = chat_str.replace("你", "我")

        chat_str = chat_str.replace("?", "!")
        chat_str = chat_str.replace("？", "！")

        print("小爱:", chat_str)


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
