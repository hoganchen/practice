# -*- coding:utf-8 -*-

import logging


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


def foo(a, b):
    c = a + b
    raise ValueError('test')
    return c


def bar(a):
    # print('a + 100:', foo(a, 100))
    print(100 / 0)


def main():
    try:
        bar(100)
    except Exception as e:
        logging.exception(e)
        # print('Exception: {}'.format(e))

    logging.info('Continue...')


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    main()
