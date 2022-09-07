# -*- coding:utf-8 -*-
"""
@Author:        hogan.chen@ymail.com
@Create Date:   2020-10-02
"""

import time
import logging
import logging.handlers
import datetime

LOG_FILE_SIZE = 2  # kb

# log level
LOGGING_LEVEL = logging.INFO


# 只输出到log文件
def logging_config_01(logging_level):
    log_format = "[Time: %(asctime)s -- Func: %(funcName)s -- Line: %(lineno)d -- Level: %(levelname)s]: %(message)s"

    # https://docs.python.org/zh-cn/3/howto/logging.html
    # https://blog.csdn.net/qq_41623250/article/details/107575912
    # 单个log文件输出，log文件的编码为open的默认值，会导致部分中文乱码
    # logging.basicConfig(filename='{}.log'.format(datetime.datetime.now().strftime('%Y%m%d_%H%M%S')),
    #                     level=logging_level, format=log_format)
    # 单个log文件输出，会造成单个log的文件大小超大的问题，编码格式为utf-8，解决中文乱码的问题
    file_handler = logging.FileHandler(filename='{}.log'.format(datetime.datetime.now().strftime('%Y%m%d_%H%M%S')),
                                       encoding='utf-8')
    logging.basicConfig(handlers={file_handler}, level=logging_level, format=log_format)


# 只输出到滚动log文件
def logging_config_02(logging_level):
    log_format = "[Time: %(asctime)s -- Func: %(funcName)s -- Line: %(lineno)d -- Level: %(levelname)s]: %(message)s"

    # https://docs.python.org/zh-cn/3/howto/logging.html
    # https://blog.csdn.net/qq_41623250/article/details/107575912
    # https://blog.csdn.net/sinat_42483341/article/details/103464691
    # log文件的编码为open的默认值，会导致部分中文乱码
    # logging.basicConfig(filename='{}.log'.format(datetime.datetime.now().strftime('%Y%m%d_%H%M%S')),
    #                     level=logging_level, format=log_format)
    # 单个log文件输出，会造成单个log的文件大小超大的问题，编码格式为utf-8，解决中文乱码的问题
    # file_handler = logging.FileHandler(filename='{}.log'.format(datetime.datetime.now().strftime('%Y%m%d_%H%M%S')),
    #                                    encoding='utf-8')
    # 滚动log文件输出，每个log的最大size为maxBytes，备份文件个数为5个，编码格式为utf-8
    rotating_handler = logging.handlers.RotatingFileHandler(filename='reminder.log', maxBytes=LOG_FILE_SIZE*1024,
                                                            backupCount=5, encoding='utf-8')

    logging.basicConfig(handlers={rotating_handler}, level=logging_level, format=log_format)


# 输出到控制台和滚动log文件
def logging_config_03(logging_level):
    log_format = "[Time: %(asctime)s -- Func: %(funcName)s -- Line: %(lineno)d -- Level: %(levelname)s]: %(message)s"
    # 控制台log输出
    logging.basicConfig(level=logging_level, format=log_format)

    # https://blog.csdn.net/sinat_42483341/article/details/103464691
    # 滚动log文件输出，每个log的最大size为maxBytes，备份文件个数为5个，编码格式为utf-8
    rotating_handler = logging.handlers.RotatingFileHandler(filename='reminder.log', maxBytes=LOG_FILE_SIZE*1024,
                                                            backupCount=5, encoding='utf-8')
    rotating_handler.setFormatter(logging.Formatter(log_format))

    logging.getLogger().addHandler(rotating_handler)


# 输出到控制台和滚动log文件
# https://docs.python.org/zh-cn/3/howto/logging-cookbook.html
def logging_config_04(logging_level):
    logger = logging.getLogger()
    logger.setLevel(logging_level)
    formatter = logging.Formatter("[Time: %(asctime)s -- Line: %(lineno)d -- Level: %(levelname)s]: %(message)s")

    # https://www.cnblogs.com/mghhzAnne/p/12307751.html
    # 控制台输出
    stream_handler = logging.StreamHandler()
    stream_handler.setLevel(logging_level)
    stream_handler.setFormatter(formatter)

    # https://blog.csdn.net/sinat_42483341/article/details/103464691
    # 滚动log文件输出，每个log的最大size为maxBytes，备份文件个数为5个，编码格式为utf-8
    rotating_handler = logging.handlers.RotatingFileHandler(filename='reminder.log', maxBytes=LOG_FILE_SIZE*1024,
                                                            backupCount=5, encoding='utf-8')
    rotating_handler.setLevel(logging_level)
    rotating_handler.setFormatter(formatter)

    logger.addHandler(stream_handler)
    logger.addHandler(rotating_handler)


# 输出到控制台和滚动log文件
# https://docs.python.org/zh-cn/3/howto/logging-cookbook.html
def logging_config_05(logging_level):
    logger = logging.getLogger()
    logger.setLevel(logging_level)
    formatter = logging.Formatter("[Time: %(asctime)s -- Line: %(lineno)d -- Level: %(levelname)s]: %(message)s")

    # https://www.cnblogs.com/mghhzAnne/p/12307751.html
    # 控制台输出
    stream_handler = logging.StreamHandler()
    stream_handler.setLevel(logging_level)
    stream_handler.setFormatter(formatter)

    # https://blog.csdn.net/sinat_42483341/article/details/103464691
    # 滚动log文件输出，每个log的最大size为maxBytes，备份文件个数为5个，编码格式为utf-8
    rotating_handler = logging.handlers.RotatingFileHandler(filename='reminder.log', maxBytes=LOG_FILE_SIZE*1024,
                                                            backupCount=5, encoding='utf-8')
    rotating_handler.setLevel(logging_level)
    rotating_handler.setFormatter(formatter)

    logger.addHandler(stream_handler)
    logger.addHandler(rotating_handler)

    return logger


def main():
    logging_config_04(LOGGING_LEVEL)

    for i in range(100):
        logging.info('logging info, i is: {}'.format(i))
        time.sleep(0.1)

    # logger = logging_config_05(LOGGING_LEVEL)
    #
    # for i in range(100):
    #     logger.info('logging info, i is: {}'.format(i))
    #     time.sleep(0.1)


if __name__ == '__main__':
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))
    time_start = time.time()

    main()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
