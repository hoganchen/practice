# -*- coding:utf-8 -*-
"""
@Author:        hogan.chen@ymail.com
@Create Date:   2020-10-02
"""

import time
import ctypes
import logging
import datetime
import threading

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


class thread_with_exception(threading.Thread):
    def __init__(self, thread_name):
        # threading.Thread.__init__(self)
        super().__init__()
        self.thread_name = thread_name
        self.stop_flag = False

    def run(self):
        # target function of the thread class
        try:
            count = 0
            while True:
                print('running {}, self.daemon: {}, self.name: {}, self.ident: {}, self.get_id(): {}, self.getName(): {}, count: {}'.format(
                    self.thread_name, self.daemon, self.name, self.ident, self.get_id(), self.getName(), count))
                count += 1
                time.sleep(1)

                if self.stop_flag:
                    break
        finally:
            print('{} ended'.format(self.thread_name))

    def stop(self):
        self.stop_flag = True

    def get_id(self):
        # returns id of the respective thread
        if hasattr(self, '_thread_id'):
            return self._thread_id
        for id, thread in threading._active.items():
            if thread is self:
                return id

    def raise_exception(self):
        thread_id = self.get_id()
        print('thread_id: {}, self.ident: {}'.format(thread_id, self.ident))

        res = ctypes.pythonapi.PyThreadState_SetAsyncExc(thread_id,
              ctypes.py_object(SystemExit))
        if res > 1:
            ctypes.pythonapi.PyThreadState_SetAsyncExc(thread_id, 0)
            print('Exception raise failure')


def main():
    t1 = thread_with_exception('Thread 1')
    t1.start()
    time.sleep(5)
    t1.raise_exception()
    t1.join(5)

    t1.stop()
    t1.join()


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
