# -*- coding:utf-8 -*-

"""
@Author:        hogan.chen@ymail.com
@Create Date:   10/01/21
"""

import time
import datetime
import platform
import subprocess


def main():
    if 'Windows' == platform.system():
        ret_val = subprocess.call(['run.bat'])
    elif 'Linux' == platform.system():
        ret_val = subprocess.call(['/bin/bash', 'run.sh'])
    else:
        ret_val = subprocess.call(['/bin/bash', 'run.sh'])

    print('ret_val: {}'.format(ret_val))


if __name__ == '__main__':
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()
    main()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
