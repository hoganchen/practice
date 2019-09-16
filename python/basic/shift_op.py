# -*- coding:utf-8 -*-
"""
@Author:        hogan.chen@ymail.com
@Create Date:   2019-04-30
"""
import time
import random
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


def shift_calc():
    # https://docs.python.org/zh-cn/3/library/random.html
    # https://www.runoob.com/python3/python3-conversion-binary-octal-hexadecimal.html
    addr = random.randrange(0xffffffff)

    # https://blog.csdn.net/u012063703/article/details/42609833
    logging.info('addr: 0x{:08x}, bin(addr): {}'.format(addr, bin(addr)))
    addr = (addr & 0xff803ff) | (0x0084 << 10)
    logging.info('addr: 0x{:08x}, bin(addr): {}'.format(addr, bin(addr)))

    rf_reg_9 = 0x25b210c6
    xo_offset = (rf_reg_9 & 0x0007fc00) >> 10
    logging.info('rf_reg_9: 0x{:08x}, xo_offset: 0x{:04x}, bin(xo_offset): {}'.format(rf_reg_9, xo_offset, bin(xo_offset)))

    rf_reg_9 = 0x25b530c6
    xo_offset = (rf_reg_9 & 0x0007fc00) >> 10
    logging.info('rf_reg_9: 0x{:08x}, xo_offset: 0x{:04x}, bin(xo_offset): {}'.format(rf_reg_9, xo_offset, bin(xo_offset)))

    rf_reg_9 = 0x25b500c6
    xo_offset = (rf_reg_9 & 0x0007fc00) >> 10
    logging.info('rf_reg_9: 0x{:08x}, xo_offset: 0x{:04x}, bin(xo_offset): {}'.format(rf_reg_9, xo_offset, bin(xo_offset)))

    rf_reg_9 = 0x25b510c6
    xo_offset = (rf_reg_9 & 0x0007fc00) >> 10
    logging.info('rf_reg_9: 0x{:08x}, xo_offset: 0x{:04x}, bin(xo_offset): {}'.format(rf_reg_9, xo_offset, bin(xo_offset)))

    rf_reg_9 = 0x25b520c6
    xo_offset = (rf_reg_9 & 0x0007fc00) >> 10
    logging.info('rf_reg_9: 0x{:08x}, xo_offset: 0x{:04x}, bin(xo_offset): {}'.format(rf_reg_9, xo_offset, bin(xo_offset)))

    rf_reg_9 = 0x25b4A0C6
    xo_offset = (rf_reg_9 & 0x0007fc00) >> 10
    logging.info('rf_reg_9: 0x{:08x}, xo_offset: 0x{:04x}, bin(xo_offset): {}'.format(rf_reg_9, xo_offset, bin(xo_offset)))

    rf_reg_9 = 0x25b490C6
    xo_offset = (rf_reg_9 & 0x0007fc00) >> 10
    logging.info('rf_reg_9: 0x{:08x}, xo_offset: 0x{:04x}, bin(xo_offset): {}'.format(rf_reg_9, xo_offset, bin(xo_offset)))



def main():
    shift_calc()


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
