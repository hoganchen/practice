# -*- coding:utf-8 -*-

"""
@Author:        hogan.chen@ymail.com
@Create Date:   2019-01-12
"""

import time
import random
import logging
import datetime
import threading


MAX_THREAD_NUM = 10

# log level
LOGGING_LEVEL = logging.DEBUG


def logging_config(logging_level):
    # log_format = "%(asctime)s - %(levelname)s - %(message)s"
    # log_format = "%(asctime)s [line: %(lineno)d] - %(levelname)s - %(message)s"
    # log_format = "[%(asctime)s - [File: %(filename)s line: %(lineno)d] - %(levelname)s]: %(message)s"
    # log_format = "[Datetime: %(asctime)s -- Line: %(lineno)d -- Level: %(levelname)s]: %(message)s"
    log_format = "[Time: %(asctime)s - Func: %(funcName)s - Line: %(lineno)d - Level: %(levelname)s]: %(message)s"
    # log_format = "[Func: %(funcName)s - Line: %(lineno)d - Level: %(levelname)s]: %(message)s"
    logging.basicConfig(level=logging_level, format=log_format)


class ThreadingHandlerExample01(threading.Thread):
    def __init__(self):
        super().__init__()
        self.loop_times = random.randint(5, 15)
        self.loop = 0
        self.end_flag = False

    def thread_handler_01(self):
        self.loop = 0

        for loop in range(self.loop_times):
            if self.end_flag:
                break

            logging.debug('[{} - {}]: Start {} loop handler...'.format(self.name, self.ident, loop))

            self.loop += 1
            time.sleep(1)

    def thread_handler_02(self):
        self.loop = 0

        while not self.end_flag:
            logging.debug('[{} - {}]: Start {} loop handler...'.format(self.name, self.ident, self.loop))

            self.loop += 1
            time.sleep(1)

    def set_end_flag(self, end_flag=True):
        self.end_flag = end_flag

    def run(self):
        self.thread_handler_01()
        logging.debug('[{} - {}]: End {} loop handler...'.format(self.name, self.ident, self.loop))


def run_threading_example_01():
    thread_handler_list = []

    for thread_index in range(MAX_THREAD_NUM):
        thread_handler = ThreadingHandlerExample01()
        thread_handler_list.append(thread_handler)

    for thread_index in range(MAX_THREAD_NUM):
        thread_handler_list[thread_index].start()

    time.sleep(10)
    logging.debug('Main threading handle finished...')

    for thread_index in range(MAX_THREAD_NUM):
        thread_handler_list[thread_index].set_end_flag()
        thread_handler_list[thread_index].join()


def main():
    run_threading_example_01()


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)

    logging.info('Script start execution at {}'.format(str(datetime.datetime.now())))
    print('-' * 120)

    time_start = time.time()
    main()

    print('-' * 120)
    logging.info('Total elapsed time: {} seconds'.format(time.time() - time_start))
    logging.info('Script end execution at {}'.format(datetime.datetime.now()))
