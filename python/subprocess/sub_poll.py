# -*- coding:utf-8 -*-
"""
@Author:        hogan.chen@ymail.com
@Create Date:   2020-10-02
"""

import time
import logging
import datetime
import platform
import subprocess

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
    '''
    stdin, stdout 和 stderr 分别指定被运行的程序的标准输入、输出和标准错误的文件句柄。合法的值
    有PIPE ,DEVNULL ,一个存在的文件描述符(一个正整数),一个存在的文件对象 以及 None。
    PIPE 表示应创建一个新的对子进程的管道。DEVNULL 表示使用特殊的os.devnull 文件。使用
    默认的 None,则不进行成定向;子进程的文件流将继承自父进程。另外,stderr 可设为STDOUT,
    表示应用程序的标准错误数据应和标准输出一同捕获。
    '''
    if 'Linux' == platform.system():
        proc = subprocess.Popen(['ping', '127.0.0.1', '-c', '5'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        # 错误的参数，导致proc.poll()结果为非0，也就是命令执行的返回结果，对linux而已，即是$?的结果
        # proc = subprocess.Popen(['ping', '127.0.0.1', '-I', '5'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    elif 'Windows' == platform.system():
        proc = subprocess.Popen(['ping', '127.0.0.1', '-n', '5'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        # 错误的参数，导致proc.poll()结果为非0
        # proc = subprocess.Popen(['ping', '127.0.0.1', '-t', '5'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)

    '''
    Popen.poll()
        检查子进程是否已被终止。设置并返回returncode 属性。否则返回 None。

    Popen.returncode
        此进程的退出码,由poll()和wait()设置(以及直接由communicate()设置)。一个None值表示此进程仍未结束。
        一个负值-N表示子进程被信号N中断(仅POSIX).
    '''
    while 1:
        proc_poll = proc.poll()
        logging.info('datetime: {}, proc.poll(): {}'.format(datetime.datetime.now(), proc_poll))

        if proc_poll is not None:
            break

    logging.info('proc end')
    logging.info('datetime: {}, proc.poll(): {}'.format(datetime.datetime.now(), proc.poll()))

    logging.info('output:\n{}'.format(proc.stdout.read().decode()))


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
