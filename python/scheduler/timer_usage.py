# -*- coding:utf-8 -*-

"""
@Author:        hogan.chen@ymail.com
@Create Date:   8/13/21
"""

import time
import logging
import datetime
import threading

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


def func():
    now = datetime.datetime.now()
    ts = now.strftime('%Y-%m-%d %H:%M:%S')
    print('do func time:', ts)
    # 在当前线程中，新建一个timer线程，然后在当前线程中start和join新建的timer线程
    # 这种方式存在问题，由于join的存在，当前线程不会结束，导致会创建越来越多的线程，从而长时间后，由于创建线程过多，从而程序崩溃
    # 可通过ps M 6023的方式查看当前程序PID的线程数，可以看出不断的增长，这是以递归的方式创建timer线程
    t = threading.Timer(2, func)
    t.setDaemon(True)
    t.start()
    # https://vimsky.com/examples/detail/python-ex-threading-Timer-join-method.html
    # timer join，避免主线程退出后，timer线程还在执行
    # t.join()


def func2():
    now = datetime.datetime.now()
    ts = now.strftime('%Y-%m-%d %H:%M:%S')
    print('do func2 time:', ts)
    t = threading.Timer(5, func2)
    t.setDaemon(True)
    t.start()
    # https://vimsky.com/examples/detail/python-ex-threading-Timer-join-method.html
    # timer join，避免主线程退出后，timer线程还在执行
    # t.join()


def main():
    func()
    func2()

    # 不能在当前线程中，去join当前线程，由于func和func1中线程的限制，所以不能执行到下面的这条语句
    # threading.current_thread().join()

    # 如果去掉func和func2中的join，以以下方式也存在问题，timer结束，对应的线程也即结束，从而导致主线程也结束，而timer线程由于是递归创建，
    # 从而timer线程还在继续执行
    # t1 = threading.Thread(target=func)
    # t2 = threading.Thread(target=func2)
    # t1.start()
    # t2.start()
    # t1.join()
    # t2.join()


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
