# -*- coding:utf-8 -*-

"""
@Author:        hogan.chen@ymail.com
@Create Date:   10/01/21
"""


def main():
    # return 1
    return False


if __name__ == '__main__':
    ret_val = main()

    print('run second utility script, ret_val: {}'.format(ret_val))

    if isinstance(ret_val, bool):
        exit(int(not ret_val))
    elif isinstance(ret_val, int):
        exit(ret_val)
    else:
        exit(0)
