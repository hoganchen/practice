# -*- coding:utf-8 -*-
"""
@Author:        hogan.chen@ymail.com
@Create Date:   2020-10-02
"""

import time
import getpass
import logging
import datetime
import platform
import threading
import subprocess

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



def kill_process_by_name(process_name):
    if 'Windows' == platform.system():
        subprocess.run('taskkill /F /T /IM {}'.format(process_name))
    elif 'Linux' == platform.system():
        subprocess.run(['killall', '-9', '{}'.format(process_name)])
    else:
        pass


def kill_process_by_pid(pid):
    if 'Windows' == platform.system():
        subprocess.run('taskkill /F /T /PID {}'.format(pid))
    elif 'Linux' == platform.system():
        # subprocess.run('kill -9 {}'.format(pid))
        subprocess.run(['kill', '-9', '{}'.format(pid)])
    else:
        pass


def subprocess_realtime_output():
    process = subprocess.Popen(["ping", "127.0.0.1", "-c", "10"], shell=False, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)

    while process.poll() is None:
        line = process.stdout.readline()
        if line:
            # print('date:{}, line: {}'.format(datetime.datetime.now(), line.decode('gb2312', errors='ignore').strip()))
            print(line.decode('gb2312', errors='ignore').strip())


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
            logging.info('The command execute abnormal, start to terminate process with pid {}...'.
                         format(self.process.pid))

            if self.process is not None:
                kill_process_by_pid(self.process.pid)

                self.process.terminate()
                # self.process.kill()

            thread.join()

        logging.debug('return code: {}'.format(self.process.returncode))

    def run(self, timeout, kill_flag=True):
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
            if kill_flag:
                logging.info('The command execute abnormal, start to terminate process with pid {}...'.format(self.process.pid))

                kill_process_by_pid(self.process.pid)
                self.process.terminate()
                # self.process.kill()

                self.process.communicate()


def subprocess_realtime_execution(cmd_str, shell=False):
    line_data = []
    process = subprocess.Popen('{}'.format(cmd_str), shell=shell, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)

    while process.poll() is None:
        line = process.stdout.readline()
        if line:
            # print('date:{}, line: {}'.format(datetime.datetime.now(), line.decode('gb2312', errors='ignore').strip()))
            print(line.decode('gb2312', errors='ignore').strip())
            line_data.append(line.decode('gb2312', errors='ignore').strip())

    return line_data


# 以windows管理员权限执行
# https://stackoverflow.com/questions/47380378/run-process-as-admin-with-subprocess-run-in-python
# https://stackoverflow.com/questions/19672352/how-to-run-script-with-elevated-privilege-on-windows
def subprocess_realtime_execution_as_admin(batch_file, shell=False):
    line_data = []
    # getpass.getuser()是获取当前登录用户名
    process = subprocess.Popen(['runas', '/noprofile', '/user:{}'.format(getpass.getuser()), '{}'.format(batch_file)], shell=shell, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    process.stdin.write('password')  # 需要设置当前用户的密码

    while process.poll() is None:
        line = process.stdout.readline()
        if line:
            # print('date:{}, line: {}'.format(datetime.datetime.now(), line.decode('gb2312', errors='ignore').strip()))
            print(line.decode('gb2312', errors='ignore').strip())
            line_data.append(line.decode('gb2312', errors='ignore').strip())

    return line_data


def main():
    subprocess_realtime_output()


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()
    main()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
