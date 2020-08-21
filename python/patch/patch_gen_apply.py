# -*- coding:utf-8 -*-

import os
import re
import shutil
import pathlib
import logging
import argparse
import datetime
import subprocess

BIN_DIR = ''
PATCH_DIR = 'patch'
PATCH_NAME = 'sdk_diff.patch'
BINARY_PATCH_NAME = 'binary_patch.txt'
GEN_PATCH_BATCH_FILE = 'gen_patch.bat'
APPLY_PATCH_BATCH_FILE = 'apply_patch.bat'
ZIP_TOOL_NAME = '7z.exe'

# log level
LOGGING_LEVEL = logging.INFO


def logging_config(logging_level):
    # log_format = "%(asctime)s - %(levelname)s - %(message)s"
    # log_format = "%(asctime)s [line: %(lineno)d] - %(levelname)s - %(message)s"
    log_format = "[%(asctime)s - [File: %(filename)s line: %(lineno)d] - %(levelname)s]: %(message)s"
    logging.basicConfig(level=logging_level, format=log_format)


def zip_folder(folder_path, zip_file_path_name=None):
    if zip_file_path_name is None:
        zip_file_path_name = '{}_{}.zip'.format(os.path.basename(folder_path),
                                                datetime.datetime.now().strftime('%Y%m%d_%H%M%S'))

    subprocess.run('{} -tZip a {} {} > nul 2>&1'.format(os.path.join(BIN_DIR, ZIP_TOOL_NAME),
                                                        zip_file_path_name, folder_path), shell=True)
    logging.debug('folder_path: {}, zip_file_path_name: {}'.format(folder_path, zip_file_path_name))

    return zip_file_path_name


def generate_patch_files(base_dir, new_dir):
    with open(os.path.join(os.path.curdir, GEN_PATCH_BATCH_FILE), 'w') as fd:
        fd.write('@echo off\n')
        fd.write('set PATH={};%PATH%\n\n'.format(os.path.join(os.path.abspath('.'), BIN_DIR)))
        fd.write('rmdir /s /q {}\n'.format(PATCH_DIR))
        fd.write('mkdir {}\n\n'.format(PATCH_DIR))

        fd.write('diff -urN {} {} > {}\n\n'.format(base_dir, new_dir, os.path.join(PATCH_DIR, PATCH_NAME)))

    print('Start to generate the patch file...\n', flush=True)
    subprocess.run('{} > nul 2>&1'.format(GEN_PATCH_BATCH_FILE))

    if os.path.exists(os.path.join(os.path.curdir, GEN_PATCH_BATCH_FILE)):
        os.remove(os.path.join(os.path.curdir, GEN_PATCH_BATCH_FILE))

    patch_file_path = os.path.join(PATCH_DIR, PATCH_NAME)
    binary_patch_file_path = os.path.join(PATCH_DIR, BINARY_PATCH_NAME)

    if os.path.exists(patch_file_path):
        with open(binary_patch_file_path, 'w') as wt_fd:
            with open(patch_file_path, 'r') as rd_fd:
                while True:
                    line_data = rd_fd.readline()

                    if line_data:
                        line_data_strip = line_data.strip()
                        if line_data_strip:
                            match_obj = re.match(r'^Files\s+(\S+)\s+and\s+(\S+)\s+differ$', line_data)
                            if match_obj:
                                base_binary_file = pathlib.Path(match_obj.group(1))
                                new_binary_file = pathlib.Path(match_obj.group(2))

                                print('Start to generate patch for {} binary file...'.format(str(new_binary_file)))

                                if base_binary_file.exists() and new_binary_file.exists():
                                    wt_fd.write('= {}\n'.format(str(new_binary_file)))

                                    copy_file_path = os.path.join(PATCH_DIR, os.path.dirname(str(new_binary_file)))
                                    os.makedirs(copy_file_path)
                                    shutil.copy(new_binary_file, copy_file_path)
                                elif base_binary_file.exists() and not new_binary_file.exists():
                                    wt_fd.write('- {}\n'.format(str(new_binary_file)))
                                elif not base_binary_file.exists() and new_binary_file.exists():
                                    wt_fd.write('+ {}\n'.format(str(new_binary_file)))

                                    copy_file_path = os.path.join(PATCH_DIR, os.path.dirname(str(new_binary_file)))
                                    os.makedirs(copy_file_path)
                                    shutil.copy(new_binary_file, copy_file_path)
                                else:
                                    print('Unknown file status, exit', flush=True)
                                    exit(1)
                    else:
                        break


def apply_patch_files(target_dir):
    print('Start to backup the {} folder...\n'.format(os.path.basename(target_dir)))
    zip_file_name = zip_folder(target_dir)

    if not os.path.exists(zip_file_name):
        print('Backup the {} folder failed, exit'.format(os.path.basename(target_dir)), flush=True)
        exit(1)

    with open(os.path.join(os.path.curdir, APPLY_PATCH_BATCH_FILE), 'w') as fd:
        fd.write('@echo off\n')
        fd.write('set PATH={};%PATH%\n\n'.format(os.path.join(os.path.abspath('.'), BIN_DIR)))

        fd.write('cd /d {}\n'.format(target_dir))
        fd.write('atch -p1 -i {}\n\n'.format(os.path.join(os.path.abspath('.'), os.path.join(PATCH_DIR, PATCH_NAME))))

    print('start to apply the patch file...\n', flush=True)
    subprocess.run(APPLY_PATCH_BATCH_FILE)

    if os.path.exists(os.path.join(os.path.curdir, APPLY_PATCH_BATCH_FILE)):
        os.remove(os.path.join(os.path.curdir, APPLY_PATCH_BATCH_FILE))

    print('start to apply the binary patch file...\n', flush=True)

    binary_patch_file_path = os.path.join(PATCH_DIR, BINARY_PATCH_NAME)
    with open(binary_patch_file_path, 'r') as rd_fd:
        while True:
            line_data = rd_fd.readline()

            if line_data:
                line_data_strip = line_data.strip()
                if line_data_strip:
                    match_obj = re.match(r'^(\S)\s+(.*?)$', line_data)

                    if match_obj:
                        op_flag = match_obj.group(1)
                        patch_file_path = os.path.join(PATCH_DIR, match_obj.group(2))
                        orig_file_path = re.sub(r'^[^\\]+', os.path.basename(target_dir), match_obj.group(2))

                        print('Start to apply patch for {} binary file...'.format(orig_file_path))

                        if '=' == op_flag or '+' == op_flag:
                            shutil.copy(patch_file_path, orig_file_path)
                        elif '-' == op_flag:
                            os.remove(orig_file_path)
                        else:
                            pass
            else:
                break


def get_command_line_parameter():
    parser = argparse.ArgumentParser()

    parser.add_argument('-o', '--op', action='store', dest='operation', default='gen',
                        help='"gen" means to generate the patch, "apply" means to apply the patch')
    parser.add_argument('-b', '--base', action='store', dest='base_dir', default='',
                        help='The base dir for generate the patch')
    parser.add_argument('-n', '--new', action='store', dest='new_dir', default='',
                        help='The new dir for generate the patch')
    parser.add_argument('-t', '--target', action='store', dest='target_dir', default='',
                        help='The target dir to apply the patch')

    args_param = parser.parse_args()

    return args_param


def check_command_line_parameter(args_param):
    if 'gen' == args_param.operation.lower():
        if not os.path.isdir(args_param.base_dir):
            print('The {} dir is not exists, please check it'.format(args_param.base_dir), flush=True)
            exit(1)

        if not os.path.isdir(args_param.new_dir):
            print('The {} dir is not exists, please check it'.format(args_param.new_dir), flush=True)
            exit(1)
    elif 'apply' == args_param.operation.lower():
        if not os.path.isdir(args_param.target_dir):
            print('The {} dir is not exists, please check it'.format(args_param.new_dir), flush=True)
            exit(1)

        if not os.path.isdir(PATCH_DIR):
            print('The {} dir is not exists, please check it'.format(PATCH_DIR), flush=True)
            exit(1)

        if not os.path.exists(os.path.join(PATCH_DIR, PATCH_NAME)):
            print('The {} patch file is not exists, please check it'.
                  format(os.path.join(PATCH_DIR, PATCH_NAME)), flush=True)
            exit(1)

        if not os.path.exists(os.path.join(PATCH_DIR, BINARY_PATCH_NAME)):
            print('The {} patch file is not exists, please check it'.
                  format(os.path.join(PATCH_DIR, BINARY_PATCH_NAME)), flush=True)
            exit(1)
    else:
        print('Unknown operation, exit', flush=True)
        exit(1)


def main():
    args_param = get_command_line_parameter()
    check_command_line_parameter(args_param)

    if 'gen' == args_param.operation.lower():
        generate_patch_files(args_param.base_dir, args_param.new_dir)

        print('\nStart to zip the patch files...', flush=True)
        zip_folder(PATCH_DIR, zip_file_path_name='{}_{}_{}'.format(PATCH_DIR, os.path.basename(args_param.base_dir),
                                                                   os.path.basename(args_param.new_dir)))
        print('\n\nGenerate the patch files success...', flush=True)
    elif 'apply' == args_param.operation.lower():
        apply_patch_files(args_param.target_dir)
        print('\n\nApply the patch files success...', flush=True)
    else:
        print('Unknown operation, exit', flush=True)
        exit(1)


if __name__ == "__main__":
    logging_config(LOGGING_LEVEL)
    main()
