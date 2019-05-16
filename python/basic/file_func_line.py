# -*- coding:utf-8 -*-
"""
@Author:        hogan.chen@ymail.com
@Create Date:   2019-05-16
"""
import sys
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


def func_01():
    print('file: {}, func: {}, line: {}'.format(sys._getframe().f_code.co_filename, sys._getframe().f_code.co_name, sys._getframe().f_lineno))


def main():
    func_01()

    print('{0}\n{0}'.format('*' * 120))
    print('sys._getframe().f_code.co_firstlineno: {}'.format(sys._getframe().f_code.co_firstlineno))
    print('sys._getframe().f_lineno: {}'.format(sys._getframe().f_lineno))
    print('sys._getframe().f_locals: {}'.format(sys._getframe().f_locals))
    print('sys._getframe().f_trace: {}'.format(sys._getframe().f_trace))
    print('sys._getframe().f_lasti: {}'.format(sys._getframe().f_lasti))
    # print('sys._getframe().f_globals: {}'.format(sys._getframe().f_globals))
    # print('sys._getframe().f_builtins: {}'.format(sys._getframe().f_builtins))
    print('sys._getframe().f_back: {}'.format(sys._getframe().f_back))
    print('sys._getframe().clear: {}'.format(sys._getframe().clear))
    print('sys._getframe().f_code.co_filename: {}'.format(sys._getframe().f_code.co_filename))
    print('sys._getframe().f_code.co_name: {}'.format(sys._getframe().f_code.co_name))
    print('sys._getframe().f_code.co_names: {}'.format(sys._getframe().f_code.co_names))
    print('sys._getframe().f_code.co_code: {}'.format(sys._getframe().f_code.co_code))
    print('sys._getframe().f_code.co_argcount: {}'.format(sys._getframe().f_code.co_argcount))
    print('sys._getframe().f_code.co_cellvars: {}'.format(sys._getframe().f_code.co_cellvars))
    print('sys._getframe().f_code.co_consts: {}'.format(sys._getframe().f_code.co_consts))
    print('sys._getframe().f_code.co_flags: {}'.format(sys._getframe().f_code.co_flags))
    print('sys._getframe().f_code.co_freevars: {}'.format(sys._getframe().f_code.co_freevars))
    print('sys._getframe().f_code.co_kwonlyargcount: {}'.format(sys._getframe().f_code.co_kwonlyargcount))
    print('sys._getframe().f_code.co_nlocals: {}'.format(sys._getframe().f_code.co_nlocals))
    print('sys._getframe().f_code.co_stacksize: {}'.format(sys._getframe().f_code.co_stacksize))
    print('sys._getframe().f_code.co_varnames: {}'.format(sys._getframe().f_code.co_varnames))


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    logging.info('Script start execution at {}'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()

    logging.info('Total elapsed time: {} seconds'.format(time.time() - time_start))
    logging.info('Script end execution at {}'.format(datetime.datetime.now()))
