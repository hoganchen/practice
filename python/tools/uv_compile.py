# -*- coding:utf-8 -*-

"""
@Author:        hogan.chen@ymail.com
@Create Date:   2019-07-30
@Update Date:   2019-07-30
@Version:       V0.1.20190730
"""

import os
import re
import time
import shutil
import logging
import datetime
import threading
import subprocess


DEBUG_MODE_FLAG = False

KEIL_PATH_ENV = 'set PATH=%PATH%;C:\\Keil_v5\\UV4;C:\\Keil_v5\\ARM\\ARMCC\\Bin;'
KEIL_PROJECT_EXTENSION_NAME = '\.uvprojx'

DEFAULT_TIMEOUT = 10  # minutes

COMPILE_SYMBOL_PROJECT_FLAG = True
COMPILE_SYMBOL_KEYWORD = 'Keil_5_sym'

TEST_LOG_DIR = '.\\build_logs'
TEST_LOG_SUFFIX = '.log'

TEST_ENV = {
    'module_name': '',
    'target_name': '',
}

COMPILE_INFO_LIST = (
    {
        'name': 'c0-rom-sdk-test',
        'timeout': 15,

        'patch_file': {
            'C0': {
                'rom_patch_lib.lib': {
                    'patch_path': '..\\patch_lib\\BALBOA_C0_PATCH',
                    'file_path': '..\\..\\new_app\\components\\sdk\\linker\\lib'
                },

                'patch': {
                    'patch_path': '..\\patch_lib\\BALBOA_C0_PATCH',
                    'file_path': '..\\..\\new_app\\components'
                },
            },
        },

        're_patch_file': {
            'C0': (
                # {
                #     'file': 'configs.opt',
                #     'path': '..\\..\\sdk\\prj_keil\\rwip_181116',
                #
                #     're_expression': (
                #         ('#-DCFG_RF_ADI', '#-DCFG_RF_ADI', '-DCFG_RF_ADI'),
                #         ('-DCFG_RF_GDX', '-DCFG_RF_GDX', '#-DCFG_RF_GDX'),
                #     )
                # },
            ),
        },

        'dependency_project': {
            'timeout': 15,
        },

        'target_dict': {
            'search_str': '(#define\s+GR551xx_)(\S+)',
            'version_tuple': ('C0',)
        },

        'config_file': '..\\..\\new_app\\build\\config\\custom_config.h',
        'paths': (
            '..\\..\\rom\\prj_keil\\rwip_181116\\rom',
            # '..\\..\\sdk\\prj_keil\\rwip_181116',
        ),

        'target_paths': (
            {
                'target_name': 'ble_sdk_rom',
                'project_path': '..\\..\\sdk\\prj_keil\\rwip_181116\\catalina_sdk_181116.uvprojx',
            },

            {
                'target_name': 'ble_sdk_lib',
                'project_path': '..\\..\\sdk\\prj_keil\\rwip_181116\\catalina_sdk_181116.uvprojx',
            },
        ),
    },
)

# log level
LOGGING_LEVEL = logging.INFO


def logging_config(logging_level):
    # log_format = "%(asctime)s - %(levelname)s - %(message)s"
    # log_format = "%(asctime)s [line: %(lineno)d] - %(levelname)s - %(message)s"
    log_format = "[%(asctime)s - [File: %(filename)s line: %(lineno)d] - %(levelname)s]: %(message)s"
    logging.basicConfig(level=logging_level, format=log_format)


def kill_uv4_process():
    # subprocess.run('taskkill /F /T /IM uv4.exe', stdin=None, stdout=None, stderr=None)
    pass


def kill_process_by_pid(pid):
    subprocess.run('taskkill /F /T /PID {}'.format(pid), stdin=None, stdout=None, stderr=None)


class RunCommand(object):
    def __init__(self, cmd):
        self.cmd = cmd
        self.process = None

    def thread_run(self, timeout, kill_flag=True):
        def target():
            logging.info('Start new thread to execute command "{}"...'.format(self.cmd))

            # process.terminate() doesn't work when using shell=True. This answer will help you
            # https://stackoverflow.com/questions/4084322/killing-a-process-created-with-pythons-subprocess-popen
            self.process = subprocess.Popen(self.cmd, shell=False)
            self.process.communicate()

            logging.info('The new thread finished')

        thread = threading.Thread(target=target)
        thread.start()
        thread.join(timeout)

        if thread.is_alive() and kill_flag:
            logging.info('The command execute abnormal, start to terminating process with pid {}...'.
                         format(self.process.pid))

            if self.process is not None:
                kill_uv4_process()
                self.process.terminate()
                # self.process.kill()

            thread.join()

        logging.debug('return code: {}'.format(self.process.returncode))

    def run(self, timeout):
        logging.info('Start new thread to execute command "{}"...'.format(self.cmd))

        '''
        A Popen creationflags parameter to specify that a new process group will be created.
        This flag is necessary for using os.kill() on the subprocess.
        '''
        # self.process = subprocess.Popen(self.cmd, shell=False, creationflags=subprocess.CREATE_NEW_PROCESS_GROUP)
        self.process = subprocess.Popen(self.cmd, shell=False)

        try:
            self.process.communicate(timeout=timeout)
        except subprocess.TimeoutExpired:
            logging.info('The command execute abnormal, start to terminating process with pid {}...'.
                         format(self.process.pid))

            kill_process_by_pid(self.process.pid)
            self.process.kill()


def patch_config_file(file_path, search_str, replace_str):
    logging.info('Start to patch {} configuration file...'.format(os.path.basename(file_path)))

    backup_file_path = '{}.bak'.format(file_path)

    if os.path.exists(file_path):
        shutil.copy(file_path, backup_file_path)
        patch_flag = False

        with open(file_path, 'w', encoding='utf-8') as wt_fd:
            with open(backup_file_path, 'r', encoding='utf-8') as rd_fd:
                while True:
                    line_data = rd_fd.readline()

                    if line_data:
                        if re.search(r'^\s*{}$'.format(search_str), line_data) and not patch_flag:
                            new_line_data = re.sub(r'{}$'.format(search_str), '\g<1>{}'.format(replace_str), line_data)
                            wt_fd.write('{}'.format(new_line_data))
                            patch_flag = True
                        else:
                            wt_fd.write(line_data)
                    else:
                        break

        subprocess.run('svn diff -x --ignore-eol-style {}'.format(file_path), timeout=5)


def restore_config_file(file_path):
    backup_file_path = '{}.bak'.format(file_path)

    if os.path.exists(backup_file_path):
        shutil.copy(backup_file_path, file_path)
        os.remove(backup_file_path)


def run_compile_test(command_line_list=None):
    batch_file_name = 'run_compile_test.bat'

    for cmd_dict in command_line_list:
        if 0 != cmd_dict['timeout']:
            run_timeout = cmd_dict['timeout'] * 60
        else:
            run_timeout = 24 * 60 * 60  # use a day as the timeout

        restore_config_file(cmd_dict['config_file'])

        target_dict = cmd_dict['target_dict']

        for target_name in target_dict['version_tuple']:
            patch_config_file(cmd_dict['config_file'], target_dict['search_str'], target_name)

            target_version = target_name[target_name.find('_')+1:]
            logging.info('target_name: {}, target_version: {}'.format(target_name, target_version))

            with open(os.path.join(os.path.curdir, batch_file_name), 'w') as fd:
                fd.write('@echo off\n')
                fd.write('setlocal EnableDelayedExpansion\n')

                fd.write('{}\n\n'.format(KEIL_PATH_ENV))
                fd.write('set curpwd=%cd%\n')

                for project_path in cmd_dict['paths']:
                    fd.write('\n')
                    fd.write('cd /d %curpwd%\n')
                    fd.write('cd /d {}\n\n'.format(project_path))

                    fd.write('for /f %%i in (\'dir *.uvprojx /s /b\') do (\n')

                    if COMPILE_SYMBOL_PROJECT_FLAG:
                        fd.write('    echo %%i | findstr /i "{}" > nul\n'.format(COMPILE_SYMBOL_KEYWORD))
                        fd.write('    if errorlevel 1 (\n')
                        fd.write('        set keiltype=keil5\n')
                        fd.write('    ) else (\n')
                        fd.write('        set keiltype=keil5-sym\n')
                        fd.write('    )\n\n')

                        fd.write('    set project=%%~ni\n')
                        fd.write('    set project=!project:_=-!\n\n')

                        fd.write('    echo Project Full Path: %%i\n\n')

                        fd.write('    cd /d %%~dpi\n\n')
                        fd.write('    for /f "delims=<> tokens=3" %%k in (\'findstr "<TargetName>" %%~nxi\') do (\n')
                        fd.write('        echo Command: "UV4 -j0 -r %%~nxi -t %%k -o %curpwd%\\{}\\'
                                 '{}_!keiltype!_!project!_{}_%%k{}"\n\n'.
                                 format(os.path.basename(TEST_LOG_DIR), cmd_dict['name'], target_version,
                                        TEST_LOG_SUFFIX))
                        fd.write('        UV4 -j0 -r %%~nxi -t %%k -o %curpwd%\\{}\\{}_!keiltype!_!project!_{}_%%k{}\n'.
                                 format(os.path.basename(TEST_LOG_DIR), cmd_dict['name'], target_version,
                                        TEST_LOG_SUFFIX))
                        fd.write('        type %curpwd%\\{}\\{}_!keiltype!_!project!_{}_%%k{}\n'.
                                 format(os.path.basename(TEST_LOG_DIR), cmd_dict['name'], target_version,
                                        TEST_LOG_SUFFIX))
                        fd.write('    )\n')
                        fd.write(')\n')
                    else:
                        fd.write('    echo %%i | findstr /i "{}" > nul\n'.format(COMPILE_SYMBOL_KEYWORD))
                        fd.write('    if errorlevel 1 (\n')

                        fd.write('        set project=%%~ni\n')
                        fd.write('        set project=!project:_=-!\n\n')

                        fd.write('        echo Project Full Path: %%i\n\n')

                        fd.write('        cd /d %%~dpi\n\n')
                        fd.write('        for /f "delims=<> tokens=3" %%k in '
                                 '(\'findstr "<TargetName>" %%~nxi\') do (\n')
                        fd.write('            echo Command: "UV4 -j0 -r %%~nxi -t %%k -o '
                                 '%curpwd%\\{}\\{}_!project!_{}_%%k{}"\n\n'.
                                 format(os.path.basename(TEST_LOG_DIR), cmd_dict['name'], target_version,
                                        TEST_LOG_SUFFIX))
                        fd.write('            UV4 -j0 -r %%~nxi -t %%k -o %curpwd%\\{}\\{}_!project!_{}_%%k{}\n'.
                                 format(os.path.basename(TEST_LOG_DIR), cmd_dict['name'], target_version,
                                        TEST_LOG_SUFFIX))
                        fd.write('            type %curpwd%\\{}\\{}_!project!_{}_%%k{}\n'.
                                 format(os.path.basename(TEST_LOG_DIR), cmd_dict['name'], target_version,
                                        TEST_LOG_SUFFIX))
                        fd.write('        )\n')
                        fd.write('    )\n')

                        fd.write(')\n')

            logging.info('run command "{}" with timeout {} seconds'.format(batch_file_name, run_timeout))

            if DEBUG_MODE_FLAG:
                run_command = RunCommand('ping -n 100 127.0.0.1')
                run_command.run(timeout=5)
            else:
                run_command = RunCommand(batch_file_name)
                run_command.run(timeout=run_timeout)

            restore_config_file(cmd_dict['config_file'])

            if not DEBUG_MODE_FLAG:
                if os.path.exists(os.path.join(os.path.curdir, batch_file_name)):
                    try:
                        os.remove(os.path.join(os.path.curdir, batch_file_name))
                    except Exception as err:
                        logging.critical('Error happened[{}] while delete {} file...'.format(err, batch_file_name))


def copy_file_to_dst(file_path, dst_folder):
    shutil.copy(file_path, dst_folder)


def copy_folder_to_dst(orig_folder, dst_folder):
    shutil.copytree(orig_folder, dst_folder)


def mv_folder_to_dst(orig_folder, dst_folder):
    shutil.move(orig_folder, dst_folder)


def rm_dst_folder(dst_folder):
    shutil.rmtree(dst_folder)


def compile_test_apply_patch(patch_list_dict):
    logging.info('Start to apply patch for compile testing...')

    for patch_file in patch_list_dict.keys():
        patch_file_dict = patch_list_dict.get(patch_file)

        orig_file_path = os.path.join(patch_file_dict['file_path'], patch_file)
        backup_file_path = os.path.join(patch_file_dict['file_path'], '{}.bak'.format(patch_file))
        patch_file_path = os.path.join(patch_file_dict['patch_path'], patch_file)

        if os.path.exists(orig_file_path):
            logging.info('Start to patch {} file...'.format(patch_file))

            if os.path.isfile(orig_file_path):
                copy_file_to_dst(orig_file_path, backup_file_path)
                copy_file_to_dst(patch_file_path, orig_file_path)
            else:
                mv_folder_to_dst(orig_file_path, backup_file_path)
                copy_folder_to_dst(patch_file_path, orig_file_path)

            subprocess.run('svn diff -x --ignore-eol-style {}'.format(orig_file_path), timeout=5)


def compile_test_restore_patch(patch_list_dict):
    logging.info('Start to restore patch for compile testing...')

    for patch_file in patch_list_dict.keys():
        patch_file_dict = patch_list_dict.get(patch_file)

        orig_file_path = os.path.join(patch_file_dict['file_path'], patch_file)
        backup_file_path = os.path.join(patch_file_dict['file_path'], '{}.bak'.format(patch_file))

        if os.path.exists(backup_file_path):
            logging.info('Start to restore {} file...'.format(patch_file))

            if os.path.isfile(backup_file_path):
                copy_file_to_dst(backup_file_path, orig_file_path)
                os.remove(backup_file_path)
            else:
                rm_dst_folder(orig_file_path)
                mv_folder_to_dst(backup_file_path, orig_file_path)


def compile_test_apply_re_patch(re_patch_list):
    logging.info('Start to apply patch for compile testing...')

    for patch_file_dict in re_patch_list:
        patch_file = patch_file_dict.get('file')

        orig_file_path = os.path.join(patch_file_dict.get('path'), patch_file)
        backup_file_path = os.path.join(patch_file_dict.get('path'), '{}.bak'.format(patch_file))
        re_match_tuple = patch_file_dict.get('re_expression')

        if os.path.exists(orig_file_path):
            logging.info('Start to patch {} file...'.format(patch_file))

            copy_file_to_dst(orig_file_path, backup_file_path)

            with open(orig_file_path, 'w', encoding='utf-8') as wt_fd:
                with open(backup_file_path, 'r', encoding='utf-8') as rd_fd:
                    while True:
                        line_data = rd_fd.readline()

                        if line_data:
                            for match_line in re_match_tuple:
                                if re.match(r'{}'.format(match_line[0]), line_data):
                                    new_line_data = re.sub(r'{}'.format(match_line[1]),
                                                           r'{}'.format(match_line[2]), line_data)
                                    wt_fd.write(new_line_data)
                                    break
                            else:
                                wt_fd.write(line_data)
                        else:
                            break

            subprocess.run('svn diff -x --ignore-eol-style {}'.format(orig_file_path), timeout=5)


def compile_test_restore_re_patch(re_patch_list):
    logging.info('Start to restore patch for compile testing...')

    for patch_file_dict in re_patch_list:
        patch_file = patch_file_dict.get('file')

        orig_file_path = os.path.join(patch_file_dict.get('path'), patch_file)
        backup_file_path = os.path.join(patch_file_dict.get('path'), '{}.bak'.format(patch_file))

        if os.path.exists(backup_file_path):
            logging.info('Start to restore {} file...'.format(patch_file))

            copy_file_to_dst(backup_file_path, orig_file_path)
            os.remove(backup_file_path)


def get_all_files_with_suffix_by_os_walk(dir_path, suffix=None):
    log_file_path_list = []

    if os.path.exists(dir_path) and os.path.isdir(dir_path):
        for folder, sub_folder, file_list in os.walk(dir_path):
            # logging.debug('folder: {}, sub_folder: {}, file_list: {}'.format(folder, sub_folder, file_list))

            for file_name in file_list:
                file_path = os.path.join(folder, file_name)

                if suffix is None:
                    log_file_path_list.append(file_path)
                else:
                    # if re.search(r'{}$'.format(re.escape(suffix)), os.path.split(file_path)[1]):
                    if re.search(r'{}$'.format(suffix), os.path.split(file_path)[1]):
                        log_file_path_list.append(file_path)

    logging.debug('File list: {}'.format(log_file_path_list))
    return log_file_path_list


def compile_path_projects(path_project_list, target_version, module_name, run_timeout, del_log_flag=False):
    for project_path in path_project_list:
        if os.path.isfile(project_path) and \
                re.search(r'{}$'.format(KEIL_PROJECT_EXTENSION_NAME), os.path.split(project_path)[1]):
            keil_project_list = [project_path]
        else:
            keil_project_list = get_all_files_with_suffix_by_os_walk(project_path,
                                                                     KEIL_PROJECT_EXTENSION_NAME)

        for keil_project_file_path in keil_project_list:
            keil_project_path = os.path.split(keil_project_file_path)[0]
            keil_project_name = os.path.split(keil_project_file_path)[1]
            project_name = os.path.splitext(keil_project_name)[0].replace('_', '-')
            log_folder_name = os.path.basename(TEST_LOG_DIR)

            logging.debug('keil_project_path: {}, keil_project_name: {}'.
                          format(keil_project_path, keil_project_name))

            if re.search(r'{}$'.format(COMPILE_SYMBOL_KEYWORD), keil_project_path, re.I):
                keil_type = 'keil5-sym'

                # do not compile the A0, B0 and B2 version for symbol projects
                if re.search(r'(?:A0|B0|B2)$', target_version):
                    logging.info('Do not compile the A0, B0 and B2 version for {} symbol project'.
                                 format(os.path.splitext(keil_project_name)[0]))
                    continue
            else:
                keil_type = 'keil5'

            batch_file_name = '{}_{}.bat'.format(project_name, keil_type)

            with open(os.path.join(os.path.curdir, batch_file_name), 'w') as fd:
                fd.write('@echo off\n')
                # fd.write('setlocal EnableDelayedExpansion\n')

                fd.write('{}\n\n'.format(KEIL_PATH_ENV))

                fd.write('set curpwd=%cd%\n')
                fd.write('cd /d {}\n\n'.format(keil_project_path))

                fd.write('for /f "delims=<> tokens=3" %%k in (\'findstr "<TargetName>" {}\') do (\n'.
                         format(keil_project_name))

                fd.write('    echo Command: "UV4 -j0 -cr {} -t %%k -o %curpwd%\\{}\\{}_{}_{}_{}_%%k{}"\n\n'.
                         format(keil_project_name, log_folder_name, module_name, keil_type,
                                project_name, target_version, TEST_LOG_SUFFIX))

                fd.write('    UV4 -j0 -cr {} -t %%k -o %curpwd%\\{}\\{}_{}_{}_{}_%%k{}\n\n'.
                         format(keil_project_name, log_folder_name, module_name, keil_type, project_name,
                                target_version, TEST_LOG_SUFFIX))

                if del_log_flag:
                    fd.write('    type %curpwd%\\{}\\{}_{}_{}_{}_%%k{}\n'.
                             format(log_folder_name, module_name, keil_type, project_name, target_version,
                                    TEST_LOG_SUFFIX))

                    fd.write('    del /s /q %curpwd%\\{}\\{}_{}_{}_{}_%%k{}\n'.
                             format(log_folder_name, module_name, keil_type, project_name, target_version,
                                    TEST_LOG_SUFFIX))

                fd.write(')\n')

            logging.info('run command "{}" with timeout {} seconds'.format(batch_file_name, run_timeout))

            if DEBUG_MODE_FLAG:
                run_command = RunCommand('ping -n 100 127.0.0.1')
                run_command.run(timeout=5)
            else:
                run_command = RunCommand(batch_file_name)
                run_command.run(timeout=run_timeout)

            if not DEBUG_MODE_FLAG:
                if os.path.exists(os.path.join(os.path.curdir, batch_file_name)):
                    try:
                        os.remove(os.path.join(os.path.curdir, batch_file_name))
                    except Exception as err:
                        logging.critical('Error happened[{}] while delete {} file...'.
                                         format(err, batch_file_name))


def compile_target_projects(target_project_list, target_version, module_name, run_timeout, del_log_flag=False):
    for project_dict in target_project_list:
        project_path = project_dict.get('project_path')
        target_name = project_dict.get('target_name')

        if os.path.isfile(project_path) and \
                re.search(r'{}$'.format(KEIL_PROJECT_EXTENSION_NAME), os.path.split(project_path)[1]):
            keil_project_list = [project_path]
        else:
            keil_project_list = get_all_files_with_suffix_by_os_walk(project_path,
                                                                     KEIL_PROJECT_EXTENSION_NAME)

        for keil_project_file_path in keil_project_list:
            keil_project_path = os.path.split(keil_project_file_path)[0]
            keil_project_name = os.path.split(keil_project_file_path)[1]
            project_name = os.path.splitext(keil_project_name)[0].replace('_', '-')
            log_folder_name = os.path.basename(TEST_LOG_DIR)

            logging.debug('keil_project_path: {}, keil_project_name: {}'.
                          format(keil_project_path, keil_project_name))

            if re.search(r'{}$'.format(COMPILE_SYMBOL_KEYWORD), keil_project_path, re.I):
                keil_type = 'keil5-sym'

                # do not compile the A0, B0 and B2 version for symbol projects
                if re.search(r'(?:A0|B0|B2)$', target_version):
                    logging.info('Do not compile the A0, B0 and B2 version for {} symbol project'.
                                 format(os.path.splitext(keil_project_name)[0]))
                    continue
            else:
                keil_type = 'keil5'

            batch_file_name = '{}_{}.bat'.format(project_name, keil_type)

            with open(os.path.join(os.path.curdir, batch_file_name), 'w') as fd:
                fd.write('@echo off\n')
                # fd.write('setlocal EnableDelayedExpansion\n')

                fd.write('{}\n\n'.format(KEIL_PATH_ENV))

                fd.write('set curpwd=%cd%\n')
                fd.write('cd /d {}\n\n'.format(keil_project_path))

                fd.write('UV4 -j0 -cr {} -t {} -o %curpwd%\\{}\\{}_{}_{}_{}_{}{}\n\n'.
                         format(keil_project_name, target_name, log_folder_name, module_name, keil_type,
                                project_name, target_version, target_name, TEST_LOG_SUFFIX))

                if del_log_flag:
                    fd.write('type %curpwd%\\{}\\{}_{}_{}_{}_{}{}\n'.
                             format(log_folder_name, module_name, keil_type, project_name, target_version,
                                    target_name, TEST_LOG_SUFFIX))

                    fd.write('del /s /q %curpwd%\\{}\\{}_{}_{}_{}_{}{}\n'.
                             format(log_folder_name, module_name, keil_type, project_name, target_version,
                                    target_name, TEST_LOG_SUFFIX))

            logging.info('run command "{}" with timeout {} seconds'.format(batch_file_name, run_timeout))

            if DEBUG_MODE_FLAG:
                run_command = RunCommand('ping -n 100 127.0.0.1')
                run_command.run(timeout=5)
            else:
                run_command = RunCommand(batch_file_name)
                run_command.run(timeout=run_timeout)

            if not DEBUG_MODE_FLAG:
                if os.path.exists(os.path.join(os.path.curdir, batch_file_name)):
                    try:
                        os.remove(os.path.join(os.path.curdir, batch_file_name))
                    except Exception as err:
                        logging.critical('Error happened[{}] while delete {} file...'.
                                         format(err, batch_file_name))


def compile_dependency_projects(dependency_prj_dict, target_version, module_name, run_timeout):
    if dependency_prj_dict.get('paths') is not None:
        dependency_prj_list = dependency_prj_dict.get('paths')

        compile_path_projects(dependency_prj_list, target_version, module_name, run_timeout, del_log_flag=True)

    if dependency_prj_dict.get('target_paths') is not None:
        dependency_prj_list = dependency_prj_dict.get('target_paths')

        compile_target_projects(dependency_prj_list, target_version, module_name, run_timeout, del_log_flag=True)


def run_balboa_compile_test():
    command_line_list = []

    module_name_list = TEST_ENV['module_name']

    logging.debug('module_name_list: {}'.format(module_name_list))

    for cmd_dict in COMPILE_INFO_LIST:
        if 'all' in module_name_list:
            command_line_list.append(cmd_dict)
        else:
            if cmd_dict['name'] in module_name_list:
                command_line_list.append(cmd_dict)

    for cmd_dict in command_line_list:
        if 0 != cmd_dict['timeout']:
            run_timeout = cmd_dict['timeout'] * 60
        else:
            run_timeout = DEFAULT_TIMEOUT * 60  # use the default timeout

        restore_config_file(cmd_dict['config_file'])

        target_dict = cmd_dict['target_dict']

        for target_version in target_dict['version_tuple']:
            patch_config_file(cmd_dict['config_file'], target_dict['search_str'], target_version)

            target_name = target_version
            logging.debug('target_name: {}, target_version: {}'.format(target_name, target_version))

            if cmd_dict.get('patch_file') is not None:
                patch_file_dict = cmd_dict.get('patch_file')

                if patch_file_dict.get(target_version) is not None and len(patch_file_dict.get(target_version)):
                    target_patch_dict = patch_file_dict.get(target_version)

                    compile_test_apply_patch(target_patch_dict)

            if cmd_dict.get('re_patch_file') is not None:
                re_patch_file_dict = cmd_dict.get('re_patch_file')

                if re_patch_file_dict.get(target_version) is not None and len(re_patch_file_dict.get(target_version)):
                    re_target_patch_list = re_patch_file_dict.get(target_version)

                    compile_test_apply_re_patch(re_target_patch_list)

            if cmd_dict.get('dependency_project') is not None:
                depend_project_dict = cmd_dict.get('dependency_project')

                if depend_project_dict.get(target_version) is not None and \
                        depend_project_dict.get('timeout') is not None:
                    target_depend_prj_dict = depend_project_dict.get(target_version)
                    target_depend_prj_timeout = depend_project_dict.get('timeout') * 60

                    compile_dependency_projects(target_depend_prj_dict, target_version, cmd_dict['name'],
                                                target_depend_prj_timeout)

            # start to compile target project folders
            if cmd_dict.get('paths') is not None:
                project_list = cmd_dict.get('paths')
                compile_path_projects(project_list, target_version, cmd_dict['name'], run_timeout)

            if cmd_dict.get('target_paths') is not None:
                target_project_list = cmd_dict.get('target_paths')
                compile_target_projects(target_project_list, target_version, cmd_dict['name'], run_timeout)

            if cmd_dict.get('patch_file') is not None:
                patch_file_dict = cmd_dict.get('patch_file')

                if patch_file_dict.get(target_version) is not None:
                    target_patch_dict = patch_file_dict.get(target_version)

                    compile_test_restore_patch(target_patch_dict)

            if cmd_dict.get('re_patch_file') is not None:
                re_patch_file_dict = cmd_dict.get('re_patch_file')

                if re_patch_file_dict.get(target_version) is not None:
                    re_target_patch_list = re_patch_file_dict.get(target_version)

                    compile_test_restore_re_patch(re_target_patch_list)

            restore_config_file(cmd_dict['config_file'])


def main():
    logging_config(LOGGING_LEVEL)
    run_compile_test(COMPILE_INFO_LIST)


if __name__ == "__main__":
    print("Script start execution at %s\n\n" % str(datetime.datetime.now()))

    time_start = time.time()
    main()

    print("\n\nScript end execution at %s" % str(datetime.datetime.now()))
    print("Total Elapsed Time: %s seconds\n" % (time.time() - time_start))
