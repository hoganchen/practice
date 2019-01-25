# -*- coding:utf-8 -*-

"""
@Author:        hogan.chen@ymail.com
@Create Date:   2019-01-12
"""

import os
import re
import time
import copy
import string
import random
import logging
import datetime


# log level
LOGGING_LEVEL = logging.DEBUG


def logging_config(logging_level):
    # log_format = "%(asctime)s - %(levelname)s - %(message)s"
    # log_format = "%(asctime)s [line: %(lineno)d] - %(levelname)s - %(message)s"
    # log_format = "[%(asctime)s - [File: %(filename)s line: %(lineno)d] - %(levelname)s]: %(message)s"
    # log_format = "[Datetime: %(asctime)s -- Line: %(lineno)d -- Level: %(levelname)s]: %(message)s"
    # log_format = "[Time: %(asctime)s -- Func: %(funcName)s -- Line: %(lineno)d -- Level: %(levelname)s]: %(message)s"
    log_format = "[Func: %(funcName)s - Line: %(lineno)d - Level: %(levelname)s]: %(message)s"
    logging.basicConfig(level=logging_level, format=log_format)


def list_slice_01():
    """
    https://foofish.net/python-list-top10.html

    切片用于获取列表中指定范的子集，语法非常简单
    items[start:end:step]
    从 start 到 end-1 位置之间的元素。step 表示步长，默认为1，表示连续获取，如果 step 为 2 就表示每隔一个元素获取。
    """
    list_example = list(x * 2 + 1 for x in range(20))
    logging.debug('len(list_example)): {}'.format(list_example))
    logging.debug('list_example: {}'.format(list_example))
    logging.debug('list_example[:]: {}'.format(list_example[:]))
    logging.debug('list_example[:5]: {}'.format(list_example[:5]))
    logging.debug('list_example[0:5]: {}'.format(list_example[0:5]))
    logging.debug('list_example[5:]: {}'.format(list_example[5:]))
    logging.debug('list_example[5:10]: {}'.format(list_example[5:10]))
    logging.debug('list_example[5:5]: {}'.format(list_example[5:5]))
    logging.debug('list_example[5:-1]: {}'.format(list_example[5:-1]))
    logging.debug('list_example[5:-2]: {}'.format(list_example[5:-2]))
    logging.debug('list_example[5:len(list_example)]: {}'.format(
        list_example[5:len(list_example)]))
    logging.debug('list_example[::2]: {}'.format(list_example[::2]))
    logging.debug('list_example[::-1]: {}'.format(list_example[::-1]))


def list_magic_01():
    """
    Values of n less than 0 are treated as 0 (which yields an empty sequence of the same type as s).
    Note that items in the sequence s are not copied; they are referenced multiple times.
    This often haunts new Python programmers
    """
    x_lists = [[]] * 3
    logging.debug('x_lists: {}'.format(x_lists))
    x_lists[0].append(1)
    logging.debug('x_lists: {}'.format(x_lists))

    """
    What has happened is that [[]] is a one-element list containing an empty list, so all three elements
    of [[]] * 3 are references to this single empty list. Modifying any of the elements of lists modifies
    this single list. You can create a list of different lists this way
    """
    y_lists = [[] for i in range(3)]
    logging.debug('y_lists: {}'.format(y_lists))
    y_lists[0].append(1)
    logging.debug('y_lists: {}'.format(y_lists))


# 默认参数必须指向不变对象
def list_magic_02(x_lists=[]):
    x_lists.append('End')

    return x_lists


def list_magic_03(x_lists=None):
    if x_lists is None:
        x_lists = []

    x_lists.append('End')

    return x_lists


def list_magic_test_01():
    logging.debug('list_magic_02([1, 2, 4]): {}'.format(
        list_magic_02([1, 2, 4])))
    logging.debug('list_magic_02(["x", "y", "z"]): {}'.format(
        list_magic_02(["x", "y", "z"])))
    logging.debug('list_magic_02(): {}'.format(list_magic_02()))
    logging.debug('list_magic_02(): {}'.format(list_magic_02()))
    logging.debug('list_magic_02(): {}'.format(list_magic_02()))

    print('-' * 120)
    logging.debug('list_magic_03([1, 2, 4]): {}'.format(
        list_magic_03([1, 2, 4])))
    logging.debug('list_magic_03(["x", "y", "z"]): {}'.format(
        list_magic_03(["x", "y", "z"])))
    logging.debug('list_magic_03(): {}'.format(list_magic_03()))
    logging.debug('list_magic_03(): {}'.format(list_magic_03()))
    logging.debug('list_magic_03(): {}'.format(list_magic_03()))


def list_extend_01():
    x_lists = list(x for x in range(10))
    y_lists = list(x for x in range(10, 20))

    logging.debug('x_lists: {}'.format(x_lists))
    logging.debug('y_lists: {}'.format(y_lists))

    add_lists = x_lists + y_lists
    x_lists.extend(y_lists)

    logging.debug('add_lists: {}'.format(add_lists))
    logging.debug('x_lists: {}'.format(x_lists))


def list_op_01():
    x_lists = list(x * 2 + 1 for x in range(10))
    x_lists.extend([x * 2 + 1 for x in range(10)])

    logging.debug('x_lists: {}'.format(x_lists))

    # pop的参数是位置
    x_lists.pop(1)
    logging.debug('x_lists: {}'.format(x_lists))

    x_lists.pop()
    logging.debug('x_lists: {}'.format(x_lists))

    # 如果列表中有重复元素，remove操作只remove最先找到的那个
    x_lists.remove(1)
    logging.debug('x_lists: {}'.format(x_lists))

    x_lists.remove(7)
    logging.debug('x_lists: {}'.format(x_lists))

    x_lists = list(x * 2 + 1 for x in range(10))
    x_lists.extend([x * 2 + 1 for x in range(10)])
    logging.debug('x_lists: {}'.format(x_lists))

    # 如下操作中，13那个列表元素没有被删除，因为当11被删除时，13所在的索引变为被删除前11所在的索引，所以就直接跳过13
    for item in x_lists:
        if 11 == item or 13 == item:
            x_lists.remove(item)

    logging.debug('x_lists: {}'.format(x_lists))

    x_lists = list(x * 2 + 1 for x in range(10))
    x_lists.extend([x * 2 + 1 for x in range(10)])
    logging.debug('x_lists: {}'.format(x_lists))

    """
    Traceback (most recent call last):
  File "list_example_01.py", line 198, in <module>
    main()
  File "list_example_01.py", line 171, in main
    list_op_01()
  File "list_example_01.py", line 130, in list_op_01
    if 11 == x_lists[list_index] or 13 == x_lists[list_index]:
IndexError: list index out of range
    """
    # 第一次删除后，x_lists的长度发生变化了，而循环还是用之前的列表长度来循环，所以会出错
    # 以上两种办法都不能用来删除列表元素，有潜在的风险
    # 注释以下代码段
    # for list_index in range(len(x_lists)):
    #     logging.debug('list_index: {}'.format(list_index))
    #     if 11 == x_lists[list_index] or 13 == x_lists[list_index]:
    #         x_lists.pop(list_index)
    #
    # logging.debug('x_lists: {}'.format(x_lists))

    """
    解决办法：方法很多，比如可以把不删除的元素重新添加到一个新的list中，也可以先拷贝一份列表备份，然后遍历备份列表，
    删除的时候就删除原列表，再或者基于索引遍历，当需要删除元素的时候，索引值对应减1,这些方法都可以根据自己需求选择。
    """
    x_lists = list(x * 2 + 1 for x in range(10))
    x_lists.extend([x * 2 + 1 for x in range(10)])
    logging.debug('x_lists: {}'.format(x_lists))

    new_lists = []

    for item in x_lists:
        if 11 != item and 13 != item:
            new_lists.append(item)

    x_lists = copy.deepcopy(new_lists)
    logging.debug('x_lists: {}'.format(x_lists))

    # 还可以一行代码搞定
    x_lists = list(x * 2 + 1 for x in range(10))
    x_lists.extend([x * 2 + 1 for x in range(10)])
    logging.debug('x_lists: {}'.format(x_lists))

    x_lists = [x for x in x_lists if 11 != x and 13 != x]
    logging.debug('x_lists: {}'.format(x_lists))


# 由以下打印可知，list(x_lists), x_lists[:], copy.copy(x_lists)这些方法只能解决最外层id值不相同的问题，
# 所以要复制一个列表，最好是用deepcopy
def list_copy_01():
    x_lists = list(x for x in range(10))
    x_lists.append([x for x in range(10)])
    y_lists = x_lists

    logging.debug('id(x_lists): {}, id(x_lists[-1]): {}, id(y_lists): {}, id(y_lists[-1]): {}'.
                  format(hex(id(x_lists)), id(x_lists[-1]), hex(id(y_lists)), id(y_lists[-1])))

    y_lists = list(x_lists)
    logging.debug('id(x_lists): {}, id(x_lists[-1]): {}, id(y_lists): {}, id(y_lists[-1]): {}'.
                  format(hex(id(x_lists)), id(x_lists[-1]), hex(id(y_lists)), id(y_lists[-1])))

    y_lists = x_lists[:]
    logging.debug('id(x_lists): {}, id(x_lists[-1]): {}, id(y_lists): {}, id(y_lists[-1]): {}'.
                  format(hex(id(x_lists)), id(x_lists[-1]), hex(id(y_lists)), id(y_lists[-1])))

    y_lists = copy.copy(x_lists)
    logging.debug('id(x_lists): {}, id(x_lists[-1]): {}, id(y_lists): {}, id(y_lists[-1]): {}'.
                  format(hex(id(x_lists)), id(x_lists[-1]), hex(id(y_lists)), id(y_lists[-1])))

    y_lists = copy.deepcopy(x_lists)
    logging.debug('id(x_lists): {}, id(x_lists[-1]): {}, id(y_lists): {}, id(y_lists[-1]): {}'.
                  format(hex(id(x_lists)), id(x_lists[-1]), hex(id(y_lists)), id(y_lists[-1])))


# 列表重复元素查找
def list_repeat_item_01():
    x_lists = list(x * 2 + 1 for x in range(10))
    x_lists.extend([x * 2 + 1 for x in range(5, 10)])

    if len(x_lists) > len(set(x_lists)):
        logging.debug('There is repeat item in the x_lists')
    else:
        logging.debug('There is not repeat item in the x_lists')

    # 打印那些元素是重复
    for x in x_lists:
        if x_lists.count(x) != 1:
            logging.debug('{} have {}'.format(x, x_lists.count(x)))

    print('-' * 120)
    # 不重复打印重复的元素
    repeat_list = []
    for x in x_lists:
        if x_lists.count(x) != 1 and x not in repeat_list:
            repeat_list.append(x)
            logging.debug('{} have {}'.format(x, x_lists.count(x)))


# 两个列表共同元素
def list_find_same_item_01():
    x_lists = list(x * 2 + 1 for x in range(10))
    y_lists = list(x * 2 + 1 for x in range(5, 15))

    same_lists = [x for x in x_lists if x in y_lists]

    logging.debug('x_lists: {}'.format(x_lists))
    logging.debug('y_lists: {}'.format(y_lists))
    logging.debug('same_lists: {}'.format(same_lists))


# 列表转字符串
def str_to_list_example_01():
    """
    >>> random.choices(string.ascii_letters)
    ['Q']
    >>> random.choice(string.ascii_letters)
    'n'

    >>> 'NT gV IJ Km Wx vs mk Yn dH 4r'.split()
    ['NT', 'gV', 'IJ', 'Km', 'Wx', 'vs', 'mk', 'Yn', 'dH', '4r']

    >>> 'www.google.com'.split('.')
    ['www', 'google', 'com']

    >>> ''.join(['NT', 'gV', 'IJ', 'Km', 'Wx', 'vs', 'mk', 'Yn', 'dH', '4r'])
    'NTgVIJKmWxvsmkYndH4r'

    >>> ' '.join(['NT', 'gV', 'IJ', 'Km', 'Wx', 'vs', 'mk', 'Yn', 'dH', '4r'])
    'NT gV IJ Km Wx vs mk Yn dH 4r'
    """

    def id_generator(size=10, chars=string.ascii_letters + string.digits + string.punctuation):
        return ''.join(random.choice(chars) for _ in range(size))

    logging.debug('id_generator(20): {}'.format(id_generator(20)))
    logging.debug('id_generator(20): {}'.format(id_generator(20, string.ascii_letters + string.digits)))

    hex_str_len = 20

    # 当随机值小于0x10，导致去除0x后，值变为一位数，导致长度不固定
    hex_str_01 = ''.join(hex(random.randint(0, 0xff)).replace('0x', '').upper() for _ in range(hex_str_len))
    logging.debug('len(hex_str): {}, hex_str: {}'.format(len(hex_str_01), hex_str_01))

    hex_str_02 = ''.join('{:02x}'.format(int(random.randint(0, 0xff))).upper() for _ in range(hex_str_len))
    logging.debug('len(hex_str): {}, hex_str: {}'.format(len(hex_str_02), hex_str_02))

    '''
    Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "/home/chenlianghong/anaconda3/lib/python3.6/random.py", line 318, in sample
    raise ValueError("Sample larger than population or is negative")
ValueError: Sample larger than population or is negative
    '''
    # 当随机个数过多会出现以上错误
    # https://blog.csdn.net/heybob/article/details/45341241
    # hex_str_03 = ''.join(random.sample(string.hexdigits, hex_str_len * 2)).upper()
    # logging.debug('len(hex_str): {}, hex_str: {}'.format(len(hex_str_03), hex_str_03))

    # https://blog.csdn.net/qq_15037231/article/details/77983468
    hex_str_04 = ''.join(random.choice(string.hexdigits) for _ in range(hex_str_len * 2)).upper()
    logging.debug('len(hex_str): {}, hex_str: {}'.format(len(hex_str_04), hex_str_04))

    '''
    python 2
    rand_str_01 = ''.join(map(lambda xx:(hex(ord(xx))[2:]),os.urandom(16)))
    '''
    # python 3，缺点，长度不确定
    #
    # http://www.runoob.com/python/python-func-ord.html
    # rand_str_01 = ''.join(map(lambda xx: (hex(ord(chr(xx)))[2:]), os.urandom(16)))
    rand_str_01 = ''.join(map(lambda xx: (hex(xx)[2:]), os.urandom(hex_str_len)))
    logging.debug('len(rand_str): {}, rand_str: {}'.format(len(rand_str_01), rand_str_01))

    # https://www.v2ex.com/t/394944
    rand_str_02 = ''.join(random.choices(string.ascii_letters + string.digits, k=hex_str_len))
    logging.debug('len(rand_str): {}, rand_str: {}'.format(len(rand_str_02), rand_str_02))

    rand_str_03 = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(hex_str_len))
    logging.debug('len(rand_str): {}, rand_str: {}'.format(len(rand_str_03), rand_str_03))

    # logging.debug('string.digits: {}, string.hexdigits: {}, string.ascii_uppercase: {}, string.ascii_lowercase: {}, '
    #               'string.octdigits: {}, string.ascii_letters: {}, string.printable: {}, string.punctuation: {}, '
    #               'string.whitespace: {}'.format(string.digits, string.hexdigits, string.ascii_uppercase,
    #                                              string.ascii_lowercase, string.octdigits, string.ascii_letters,
    #                                              string.printable, string.punctuation, string.whitespace))
    logging.debug('string.digits: {}, string.hexdigits: {}, string.ascii_uppercase: {}, string.ascii_lowercase: {}, '
                  'string.octdigits: {}, string.ascii_letters: {}, string.punctuation: {}'.
                  format(string.digits, string.hexdigits, string.ascii_uppercase,
                         string.ascii_lowercase, string.octdigits, string.ascii_letters, string.punctuation))

    rand_str = ''.join(random.choices(string.ascii_letters + string.digits, k=hex_str_len))
    logging.debug('len(rand_str): {}, rand_str: {}'.format(len(rand_str), rand_str))

    # .匹配除'\n'外的任意字符，{m,n}表示匹配前一个字符m到n次，m和n可以省略：若省略m，则匹配0到n次；若省略n，则匹配m到无限次
    # http://www.cnblogs.com/huxi/archive/2010/07/04/1771073.html
    split_rand_str_list = re.findall('.{1,2}', rand_str)
    logging.debug('split_rand_str_list: {}'.format(split_rand_str_list))

    comb_rand_str = ' '.join(split_rand_str_list)
    logging.debug('comb_rand_str: {}'.format(comb_rand_str))

    # # .匹配除'\n'外的任意字符，{m,n}表示匹配前一个字符m到n次，m和n相等时，则可简化为{m}
    split_rand_str_list = re.findall('.{2,2}', rand_str)
    logging.debug('split_rand_str_list: {}'.format(split_rand_str_list))

    comb_rand_str = ' '.join(split_rand_str_list)
    logging.debug('comb_rand_str: {}'.format(comb_rand_str))

    # .匹配除'\n'外的任意字符，{m}示匹配前一个字符m次
    split_rand_str_list = re.findall('.{2}', rand_str)
    logging.debug('split_rand_str_list: {}'.format(split_rand_str_list))

    comb_rand_str = ' '.join(split_rand_str_list)
    logging.debug('comb_rand_str: {}'.format(comb_rand_str))

    rand_str = ''.join(random.choices(string.ascii_letters + string.digits, k=hex_str_len - 1))
    logging.debug('len(rand_str): {}, rand_str: {}'.format(len(rand_str), rand_str))

    # .匹配除'\n'外的任意字符，{m,n}表示匹配前一个字符m到n次，m和n可以省略：若省略m，则匹配0到n次；若省略n，则匹配m到无限次
    # http://www.cnblogs.com/huxi/archive/2010/07/04/1771073.html
    split_rand_str_list = re.findall('.{1,2}', rand_str)
    logging.debug('split_rand_str_list: {}'.format(split_rand_str_list))

    comb_rand_str = ' '.join(split_rand_str_list)
    logging.debug('comb_rand_str: {}'.format(comb_rand_str))

    # # .匹配除'\n'外的任意字符，{m,n}表示匹配前一个字符m到n次，m和n相等时，则可简化为{m}
    split_rand_str_list = re.findall('.{2,2}', rand_str)
    logging.debug('split_rand_str_list: {}'.format(split_rand_str_list))

    comb_rand_str = ' '.join(split_rand_str_list)
    logging.debug('comb_rand_str: {}'.format(comb_rand_str))

    # .匹配除'\n'外的任意字符，{m}示匹配前一个字符m次
    split_rand_str_list = re.findall('.{2}', rand_str)
    logging.debug('split_rand_str_list: {}'.format(split_rand_str_list))

    comb_rand_str = ' '.join(split_rand_str_list)
    logging.debug('comb_rand_str: {}'.format(comb_rand_str))


def main():
    list_slice_01()

    print('*' * 120)
    list_magic_01()

    print('*' * 120)
    list_extend_01()

    print('*' * 120)
    list_op_01()

    print('*' * 120)
    list_magic_test_01()

    print('*' * 120)
    list_copy_01()

    print('*' * 120)
    list_repeat_item_01()

    print('*' * 120)
    list_find_same_item_01()

    print('*' * 120)
    str_to_list_example_01()


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)

    logging.info('Script start execution at {}'.format(str(datetime.datetime.now())))

    print('-' * 120)

    time_start = time.time()

    main()

    print('-' * 120)

    logging.info('Total elapsed time: {} seconds'.format(time.time() - time_start))
    logging.info('Script end execution at {}'.format(datetime.datetime.now()))
