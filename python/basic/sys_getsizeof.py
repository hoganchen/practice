# -*- coding:utf-8 -*-
"""
@Author:        hogan.chen@ymail.com
@Create Date:   2020-10-02
"""

import sys
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


# https://my.oschina.net/u/4051725/blog/3100186
'''
Python 内存分配时的小秘密

由此能看出可变对象在扩充时的秘密：
    超额分配机制： 申请新内存时并不是按需分配的，而是多分配一些，因此当再添加少量元素时，不需要马上去申请新内存
    非均匀分配机制： 三类对象申请新内存的频率是不同的，而同一类对象每次超额分配的内存并不是均匀的，而是逐渐扩大的
'''
def main():
    letters = "abcdefghijklmnopqrstuvwxyz"

    a = []
    for i in letters:
        a.append(i)
        print(f'{len(a)}, sys.getsizeof(a) = {sys.getsizeof(a)}')

    b = set()
    for j in letters:
        b.add(j)
        print(f'{len(b)}, sys.getsizeof(b) = {sys.getsizeof(b)}')

    c = dict()
    for k in letters:
        c[k] = k
        print(f'{len(c)}, sys.getsizeof(c) = {sys.getsizeof(c)}')


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
