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


def normal_communicate():
    if 'Linux' == platform.system():
        proc = subprocess.Popen(['ping', '127.0.0.1', '-c', '5'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        # 错误的参数，导致proc.poll()结果为非0，也就是命令执行的返回结果，对linux而已，即是$?的结果
        # proc = subprocess.Popen(['ping', '127.0.0.1', '-I', '5'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    elif 'Windows' == platform.system():
        proc = subprocess.Popen(['ping', '127.0.0.1', '-n', '5'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        # 错误的参数，导致proc.poll()结果为非0
        # proc = subprocess.Popen(['ping', '127.0.0.1', '-t', '5'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)

    proc_stdout = None
    proc_stderr = None

    try:
        proc_stdout, proc_stderr = proc.communicate(timeout=5)
    except subprocess.TimeoutExpired:
        logging.info('The command execute abnormal, start to terminating process with pid {}...'.format(proc.pid))
        proc.kill()
        proc_stdout, proc_stderr = proc.communicate()
    else:
        logging.info('The command execute normally, and no TimeoutExpired...')
    finally:
        if proc_stdout is not None:
            logging.info('stdout:\n{}'.format(proc_stdout.decode()))
        if proc_stderr is not None:
            logging.info('stderr:\n{}'.format(proc_stderr.decode()))


def timeout_communicate():
    if 'Linux' == platform.system():
        proc = subprocess.Popen(['ping', '127.0.0.1', '-c', '5'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        # 错误的参数，导致proc.poll()结果为非0，也就是命令执行的返回结果，对linux而已，即是$?的结果
        # proc = subprocess.Popen(['ping', '127.0.0.1', '-I', '5'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    elif 'Windows' == platform.system():
        proc = subprocess.Popen(['ping', '127.0.0.1', '-n', '5'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        # 错误的参数，导致proc.poll()结果为非0
        # proc = subprocess.Popen(['ping', '127.0.0.1', '-t', '5'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)

    proc_stdout = None
    proc_stderr = None

    try:
        proc_stdout, proc_stderr = proc.communicate(timeout=2)
    except subprocess.TimeoutExpired:
        logging.info('The command execute abnormal, start to terminating process with pid {}...'.format(proc.pid))
        proc.kill()
        proc_stdout, proc_stderr = proc.communicate()
    else:
        logging.info('The command execute normally, and no TimeoutExpired...')
    finally:
        if proc_stdout is not None:
            logging.info('stdout:\n{}'.format(proc_stdout.decode()))
        if proc_stderr is not None:
            logging.info('stderr:\n{}'.format(proc_stderr.decode()))


def main():
    '''
    与进程交互:向 stdin 传输数据。从 stdout 和 stderr 读取数据,直到文件结束符。等待进程终止。可
    选的 input 参数应当未被传输给子进程的数据,如果没有数据应被传输给子进程则为 None。如果
    流以文本模式打开,input 必须为字符串。否则,它必须为字节。

    communicate() 返回一个 (stdout_data, stderr_data) 元组。如果文件以文本模式打开
    则为字符串;否则字节。

    注意如果你想要向进程的 stdin 传输数据,你需要通过 stdin=PIPE 创建此 Popen 对象。类似的,
    要从结果元组获取任何非 None 值,你同样需要设置 stdout=PIPE 或者 stderr=PIPE。

    如果进程在 timeout 秒后未终止,一个TimeoutExpired 异常将被抛出。捕获此异常并重新等待将
    不会丢失任何输出。

    如果超时到期,子进程不会被杀死,所以为了正确清理一个行为良好的应用程序应该杀死子进程并
    完成通讯。
    proc = subprocess.Popen(...)
    try:
        outs, errs = proc.communicate(timeout=15)
    except TimeoutExpired:
        proc.kill()
        outs, errs = proc.communicate()

    注解: 内存里数据读取是缓冲的,所以如果数据尺寸过大或无限,不要使用此方法。
    '''
    normal_communicate()
    timeout_communicate()


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
