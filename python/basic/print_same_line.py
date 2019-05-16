# -*- coding:utf-8 -*-
"""
@Author:        hogan.chen@ymail.com
@Create Date:   2019-05-16
"""
import sys
import time
import curses
import logging
import datetime


# log level
LOGGING_LEVEL = logging.INFO


def logging_config(logging_level):
    # log_format = "%(asctime)s - %(levelname)s - %(message)s"
    # log_format = "%(asctime)s [line: %(lineno)d] - %(levelname)s - %(message)s"
    # log_format = "[line: %(lineno)d] - %(levelname)s - %(message)s"
    # log_format = "[%(asctime)s - [File: %(filename)s line: %(lineno)d] - %(levelname)s]: %(message)s"
    log_format = "[%(asctime)s - [line: %(lineno)d] - %(levelname)s]: %(message)s"
    logging.basicConfig(level=logging_level, format=log_format)


def method_01():
    for progress in range(100):
        time.sleep(0.5)
        sys.stdout.write("Download progress: %d%%   \r" % (progress))
        sys.stdout.flush()


def method_02():
    # https://blog.csdn.net/debug_snail/article/details/50829616
    # https://blog.csdn.net/u012936765/article/details/77159435

    for progress in range(100):
        time.sleep(0.5)
        # print("Download progress: %d%%   \r" % (progress), end='')
        # print("\rDownload progress: %d%%   " % (progress), end='')

        current_time_str = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S,%f')[0:-3]
        print('[{} - [line: {}] - INFO]：Download progress: {}%   \r'.
              format(current_time_str, sys._getframe().f_lineno, progress), end='')


def method_03():
    # https://docs.python.org/3/howto/curses.html
    # https://www.ibm.com/developerworks/cn/linux/sdk/python/python-6/index.html

    stdscr = curses.initscr()
    pad = curses.newpad(100, 100)
    #  These loops fill the pad with letters; this is
    # explained in the next section
    for y in range(0, 100):
        for x in range(0, 100):
            try: pad.addch(y,x, ord('a') + (x*x+y*y) % 26 )
            except curses.error: pass
            time.sleep(0.001)

        #  Displays a section of the pad in the middle of the screen
        pad.refresh( 0,0, 5,5, 20,75)
    curses.endwin()


def method_04():
    stdscr = curses.initscr()
    stdscr.addstr(5,10,'abv',curses.A_REVERSE)
    while 1:
        c = stdscr.getch()
        if c == ord('b'):break

        for i in range(100,110):
            time.sleep(1)
            stdscr.refresh()
            stdscr.addstr(10,10,chr(i)*10)
    curses.endwin()


def main():
    # https://www.zhihu.com/question/21100416
    # http://www.cnblogs.com/lustralisk/p/pythonProgressBar.html
    method_02()


if __name__ == "__main__":
    logging_config(LOGGING_LEVEL)

    logging.info('Script start execution at {}\n'.format(datetime.datetime.now()))

    time_start = time.time()
    main()

    logging.info('Script end execution at {}\n'.format(datetime.datetime.now()))
    logging.info('Total Elapsed Time: {} seconds\n'.format(time.time() - time_start))
