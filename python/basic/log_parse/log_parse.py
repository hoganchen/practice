# -*- coding:utf-8 -*-

import time
import logging
import datetime
import binascii

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
    log_hex_str = '''
    '''


    log_handle_str = log_hex_str
    log_str = ''

    while True:
        log_header_pos = log_handle_str.find('ff0000')
        if -1 == log_header_pos:
            break
        log_header_len_str = log_handle_str[log_header_pos + 6: log_header_pos + 10]
        print('log_header_len_str: {}'.format(log_header_len_str))
        le_log_header_len_str = log_header_len_str[2:] + log_header_len_str[:2]
        print('le_log_header_len_str: {}'.format(le_log_header_len_str))
        log_header_len = int(le_log_header_len_str, 16)
        # log_header_len = int(log_header_len_str, 16)
        print('log_header_len: {}'.format(log_header_len))
        log_str += log_handle_str[log_header_pos + 10:log_header_pos + 10 + log_header_len * 2]
        log_handle_str = log_handle_str[log_header_pos + 10 + log_header_len * 2:]

    print(log_str)
    # print(binascii.a2b_hex(log_str).decode('unicode-escape', 'ignore'))
    print(binascii.a2b_hex(log_str).decode('utf-8', 'ignore'))

if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))