# -*- coding:utf-8 -*-

"""
@Author:        hogan.chen@ymail.com
@Create Date:   12/28/21
"""

import time
import random
import logging
import datetime

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


# https://blog.csdn.net/u013555719/article/details/84550700
def list_del_example_01():
    # random_list = [random.randint(0, 100) for _ in range(10)]
    random_list = [54, 38, 46, 67, 97, 90, 81, 11, 28, 60]
    del_index_list = [1, 5, 9]
    print('random_list: {}'.format(random_list))

    # 该方法不能正确删除对应索引位置的列表元素，因为前面的列表元素删除后，后面的列表元素前移，所以索引发生了改变，
    # 而且删除列表中的元素后，列表的实际长度变小了，但是循环次数没有减少，依然按照原来列表的长度进行遍历，所以会造成索引溢出
    index_list = list(range(len(random_list)))
    print('index_list: {}'.format(index_list))

    for index in index_list:
        if index in del_index_list:
            random_list.remove(random_list[index])
        print('index: {}, random_list: {}'.format(index, random_list))


# https://blog.csdn.net/u013555719/article/details/84550700
def list_del_example_02():
    # random_list = [random.randint(0, 100) for _ in range(10)]
    random_list = [54, 38, 46, 67, 97, 90, 81, 11, 28, 60]
    del_index_list = [1, 5, 9]
    print('random_list: {}'.format(random_list))

    index_list = list(range(len(random_list)))[::-1]
    print('index_list: {}'.format(index_list))

    # 该方法能正确删除对应索引位置的列表元素，因为后面的列表元素删除后，再后面的列表元素前移，不会影响未删除的列表元素索引
    for index in index_list:
        if index in del_index_list:
            random_list.remove(random_list[index])
        print('index: {}, random_list: {}'.format(index, random_list))


def main():
    # list_del_example_01()
    list_del_example_02()


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
