# -*- coding:utf-8 -*-

"""
@Author:        hogan.chen@ymail.com
@Create Date:   2019-06-18
@Update Date:   2019-06-18
@Version:       V0.9.20190618
"""

import os
import time
import shutil
import logging
import zipfile
import datetime
import argparse

import socket_config
import socket_control


def get_datetime_now():
    now_time_str = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')

    return now_time_str


def archive_test_logs():
    logging.info('Start to archive the backup files and delete unnecessary archive files ...')

    archive_folder_path = socket_config.TEST_LOG_ARCHIVE_PATH

    if os.path.exists(archive_folder_path):
        if not os.path.isdir(archive_folder_path):
            try:
                os.remove(archive_folder_path)
                os.makedirs(archive_folder_path)
            finally:
                pass
    else:
        try:
            os.makedirs(archive_folder_path)
        finally:
            pass

    archive_file_list = socket_config.get_all_files_with_suffix(os.path.dirname(socket_config.TEST_LOG_DIR), suffix='.zip')

    for archive_file in archive_file_list:
        shutil.copy2(os.path.join(os.path.dirname(socket_config.TEST_LOG_DIR), archive_file), archive_folder_path)
        os.remove(archive_file)

    archive_file_list = socket_config.get_all_files_with_suffix(archive_folder_path, suffix='.zip')

    if len(archive_file_list) > socket_config.TEST_LOG_MAX_ARCHIVE_NUM:
        archive_file_list.sort(key=lambda fn: os.path.getmtime(fn))

        for archive_file in archive_file_list[:0 - socket_config.TEST_LOG_MAX_ARCHIVE_NUM]:
            logging.debug('delete archive file {} ...'.format(archive_file))
            os.remove(archive_file)


def clean_folder(folder_path, file_list=None):
    logging.info('Start to clean the {} folder...'.format(os.path.basename(folder_path)))

    if os.path.exists(folder_path):
        if not os.path.isdir(folder_path):
            try:
                os.remove(folder_path)
                os.makedirs(folder_path)
            finally:
                pass
        else:
            if file_list is None:
                clean_file_list = os.listdir(folder_path)
            else:
                clean_file_list = file_list

            for file_name in clean_file_list:
                file_path = os.path.join(folder_path, file_name)

                try:
                    if os.path.isdir(file_path):
                        shutil.rmtree(file_path)
                    else:
                        os.remove(file_path)
                finally:
                    pass
    else:
        try:
            os.makedirs(folder_path)
        finally:
            pass


def zip_log_folder(folder_path, zip_file_name=None, zip_flag=True):
    logging.info('Start to backup the {} folder...'.format(os.path.basename(folder_path)))

    if zip_flag:
        if zip_file_name is None:
            now_time_str = get_datetime_now()
            zip_file_name = 'LOG_{}_{}.zip'.format(os.path.split(folder_path)[1], now_time_str)

        tc_zip_file = zipfile.ZipFile(os.path.join(os.path.dirname(folder_path), zip_file_name), 'w',
                                      compression=zipfile.ZIP_DEFLATED)

        for folder, sub_folders, files in os.walk(folder_path):
            for file_name in files:
                while True:
                    try:
                        tc_zip_file.write(os.path.join(folder, file_name),
                                          arcname=os.path.relpath(os.path.join(folder, file_name),
                                                                  os.path.dirname(folder_path)))
                    except Exception as err:
                        logging.critical('Zip handle error happened[{}]...'.format(err))
                    else:
                        break

        tc_zip_file.close()


def get_command_line_parameter():
    parser = argparse.ArgumentParser()

    parser.add_argument('-p', '--port', action='store', dest='server_port', default=8000,
                        help='The tcp port of socket server')
    parser.add_argument('-i', '--interval', action='store', dest='time_interval', default=720,
                        help='The time interval of the log file')

    args_param = parser.parse_args()

    return args_param


def main():
    socket_config.logging_config(socket_config.LOGGING_LEVEL)

    args_param = get_command_line_parameter()

    socket_config.set_test_env(args_param)

    while True:
        # clean log folder
        clean_folder(socket_config.TEST_LOG_DIR)
        clean_folder(socket_config.TEST_CONSOLE_OUTPUT_DIR)

        # run test cases
        socket_control.start_log_server()

        # zip the log folder
        zip_log_folder(socket_config.TEST_LOG_DIR)
        zip_log_folder(socket_config.TEST_CONSOLE_OUTPUT_DIR)

        # archive log files
        archive_test_logs()


if __name__ == "__main__":
    print("Script start execution at {}".format(str(datetime.datetime.now())))

    time_start = time.time()
    main()

    print("\n\nTotal Elapsed Time: {} seconds".format(time.time() - time_start))
    print("\nScript end execution at {}".format(datetime.datetime.now()))
