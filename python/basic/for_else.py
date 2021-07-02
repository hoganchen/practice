# -*- coding:utf-8 -*-
"""
@Author:        hogan.chen@ymail.com
@Create Date:   2020-10-02
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


# https://foofish.net/for-else.html
'''
只有当循环里没有遇到 break 时，else 块才会执行。此刻，你应该明白了，真正和 else 搭配使用的是 for 循环中的 break，break ... else ... 才是两个互斥的条件

当你用 for 循环迭代查找列表的中的某个元素时，如果找到了就立刻退出循环，如果迭代完了列表还没找到需要以另外一种形式（比如异常）的方式通知调用者时，用 for...else... 无疑是最好的选择。
'''
def main():
    prime_list = []
    for n in range(2, 10000):
        for x in range(2, n):
            if n % x == 0:
                # print( n, 'equals', x, '*', int(n/x))
                break
        else:
            # loop fell through without finding a factor
            # print(n, 'is a prime number')
            prime_list.append(n)

    print('len(prime_list):{}, prime_list\n{}'.format(len(prime_list), prime_list))


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
