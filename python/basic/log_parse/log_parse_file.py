# -*- coding:utf-8 -*-

import re
import os
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


def get_all_files_with_suffix(dir_path, suffix=None):
    log_file_path_list = []

    if os.path.exists(dir_path) and os.path.isdir(dir_path):
        file_list = os.listdir(dir_path)

        for file in file_list:
            file_path = os.path.join(dir_path, file)

            if os.path.isdir(file_path):
                continue
                # not support recursion getting
                # get_all_files_with_suffix(file_path, suffix)
            else:
                if suffix is None:
                    log_file_path_list.append(file_path)
                else:
                    if re.search(r'{}$'.format(re.escape(suffix)), os.path.split(file_path)[1]):
                        log_file_path_list.append(file_path)
                    """
                     if -1 != os.path.split(file_path)[1].find(r'{}'.format(suffix)):
                        log_file_path_list.append(file_path)
                   """
                """
                if suffix is None:
                    log_file_path_list.append(file_path)
                else:
                    # suffix = ['log', 'xml']
                    if isinstance(suffix, list) or isinstance(suffix, tuple):
                        if os.path.splitext(os.path.split(file_path)[1])[1][1:] in suffix:
                            log_file_path_list.append(file_path)
                    elif isinstance(suffix, str):
                        # suffix = '*.log'
                        # if '*.' in suffix:  # abc*.log will match this condition
                        if 0 == suffix.find(r'*.'):
                            if fnmatch.fnmatch(file_path, suffix):
                                log_file_path_list.append(file_path)
                        else:
                            # abc*d.log ==> log
                            suffix = re.sub(r'^.*\.', '', suffix)
                            if os.path.splitext(os.path.split(file_path)[1])[1][1:] == suffix:
                                log_file_path_list.append(file_path)
                """

    logging.debug('File list: {}'.format(log_file_path_list))
    return log_file_path_list


def main():
    log_file_list = get_all_files_with_suffix('.\\', '.log')

    for log_file in log_file_list:
        print('Start to parse {} file...'.format(log_file))

        sdk_log_file = log_file.replace('.log', '_sdk.log')
        with open(sdk_log_file, 'w') as sdk_log_fd:
            raw_event_data = ''

            with open(log_file, 'r', encoding='utf-8') as log_fd:
                while True:
                    log_line_str = log_fd.readline()
                    if log_line_str:
                        if re.search('\s+->\s+\[Platform\]', log_line_str):
                            if -1 == log_line_str.find('Send command'):
                                temp_str = re.search('\s+->\s+\[Platform\](\w+)', log_line_str).group(1)
                                # print(temp_str)
                                raw_event_data += temp_str
                    else:
                        break

            sdk_log_str = ''
            temp_raw_event_data = raw_event_data[:]

            '''
            while True:
                log_header_pos = temp_raw_event_data.find('ff0000')
                if -1 == log_header_pos:
                    break
                log_header_len_str = temp_raw_event_data[log_header_pos + 6: log_header_pos + 10]
                le_log_header_len_str = log_header_len_str[2:] + log_header_len_str[:2]
                log_header_len = int(le_log_header_len_str, 16)
                sdk_log_str += temp_raw_event_data[log_header_pos + 10:log_header_pos + 10 + log_header_len * 2]
                temp_raw_event_data = temp_raw_event_data[log_header_pos + 10 + log_header_len * 2:]
            '''

            while True:
                log_header_pos = temp_raw_event_data.find('ff0000')
                if -1 == log_header_pos:
                    break
                log_header_len_str = temp_raw_event_data[log_header_pos + 6: log_header_pos + 10]
                # print('log_header_len_str: {}'.format(log_header_len_str))
                le_log_header_len_str = log_header_len_str[2:] + log_header_len_str[:2]
                # print('le_log_header_len_str: {}'.format(le_log_header_len_str))
                log_header_len = int(le_log_header_len_str, 16)
                # log_header_len = int(log_header_len_str, 16)
                # print('log_header_len: {}'.format(log_header_len))
                sdk_log_str += temp_raw_event_data[log_header_pos + 10:log_header_pos + 10 + log_header_len * 2]
                temp_raw_event_data = temp_raw_event_data[log_header_pos + 10 + log_header_len * 2:]

            try:
                # 采用第一种decode为unicode的形式，会在某些情况下会报错，但是第二种decode为utf-8的则不会
                # sdk_log_fd.write(binascii.a2b_hex(sdk_log_str).decode('unicode-escape', 'ignore'))
                sdk_log_fd.write(binascii.a2b_hex(sdk_log_str).decode('utf-8', 'ignore'))
            except Exception as err:
                print('error message: {}'.format(err))
                print('raw_event_data:\n{}'.format(raw_event_data))
                print('sdk_log_str:\n{}'.format(sdk_log_str))

if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
