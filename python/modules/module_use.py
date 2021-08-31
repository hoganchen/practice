# -*- coding:utf-8 -*-
"""
@Author:        hogan.chen@ymail.com
@Create Date:   2020-10-02
"""

import time
import logging
import datetime
import arithmetic as a4

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


def letscook(x, y, oper):
    """
    在__init__.py中， 我们import了arithmetic下的所有子模块，并在__init__.py中给各个子模块的核心功能取了新的名字，
    作为arithmetic模块的变量。所以我们在main.py中import了arithmetic模块之后，就可以直接进行使用了。
    如果你使用from arithmetic import * 语句，那么我们就可以使用add、sub、mul、dev，连a4都省了。
    """
    r = 0
    if oper == "+":
        r = a4.add(x, y)
    elif oper == "-":
        r = a4.sub(x, y)
    elif oper == "*":
        r = a4.mul(x, y)
    else:
        r = a4.dev(x, y)

    print("{} {} {} = {}".format(x, oper, y, r))


def main():
    x, y = 3, 8

    letscook(x, y, "+")
    letscook(x, y, "-")
    letscook(x, y, "*")
    letscook(x, y, "/")


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
