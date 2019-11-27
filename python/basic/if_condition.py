# -*- coding:utf-8 -*-
"""
@Author:        hogan.chen@ymail.com
@Create Date:   2019-04-30
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


def main():
    condition_list_01 = [[], '', None]
    condition_list_02 = [['a'], [[]], 'a']

    '''
    https://docs.python.org/zh-cn/3/library/stdtypes.html#truth-value-testing

    任何对象都可以进行逻辑值的检测，以便在 if 或 while 作为条件或是作为下文所述布尔运算的操作数来使用。

    一个对象在默认情况下均被视为真值，除非当该对象被调用时其所属类定义了 __bool__() 方法且返回 False 或是定义了 __len__() 方法且返回零。 1 下面基本完整地列出了会被视为假值的内置对象:

    被定义为假值的常量: None 和 False。
    任何数值类型的零: 0, 0.0, 0j, Decimal(0), Fraction(0, 1)
    空的序列和多项集: '', (), [], {}, set(), range(0)

    产生布尔值结果的运算和内置函数总是返回 0 或 False 作为假值，1 或 True 作为真值，除非另行说明。 （重要例外：布尔运算 or 和 and 总是返回其中一个操作数。）
    '''

    for condition in condition_list_01:
        logging.info('Start to check "{}" in if condition...'.format(condition))

        if condition is not None:
            logging.info('len({}) = {}'.format(condition, len(condition)))

        if condition:
            logging.info('The condition "{}" is True.'.format(condition))
        else:
            logging.info('The condition "{}" is False.'.format(condition))

    print('\n################################################################################')
    print('################################################################################\n')

    for condition in condition_list_02:
        logging.info('Start to check "{}" in if condition...'.format(condition))

        if condition is not None:
            logging.info('len({}) = {}'.format(condition, len(condition)))

        if condition:
            logging.info('The condition "{}" is True.'.format(condition))
        else:
            logging.info('The condition "{}" is False.'.format(condition))


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
