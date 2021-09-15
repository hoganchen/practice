# -*- coding:utf-8 -*-
"""
@Author:        hogan.chen@ymail.com
@Create Date:   2020-10-02
"""

import time
import logging
import datetime
import functools

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


def dec_foo(func):
    """This is dec_foo docstring"""
    def inner():
        """This is inner docstring"""
        print('Begin to call {} func...'.format(func.__name__))
        func()
        print('End to call {} func...'.format(func.__name__))
    return inner


@dec_foo
def foo():
    """This is foo docstring"""
    print('This is foo function...')


def my_decorator(f):
    # @functools.wraps(f)
    def warpper(*args, **kwargs):
        print('Calling decorated function')
        return f(*args, **kwargs)

    return warpper


@dec_foo
@my_decorator
def example():
    """Docstring"""
    print('Called example function')


def dec_func(func):
    """This is dec_func docstring"""
    '''
     @functools.wraps(wrapped, assigned=WRAPPER_ASSIGNMENTS, updated=WRAPPER_UPDATES)

    这是一个便捷函数，用于在定义包装器函数时发起调用 update_wrapper() 作为函数装饰器。
    它等价于 partial(update_wrapper, wrapped=wrapped, assigned=assigned, updated=updated)。

    如果不使用这个装饰器工厂函数，则 example 函数的名称将变为 'wrapper'，并且 example() 原本的文档字符串将会丢失。
    '''
    @functools.wraps(func)
    def warpper(*args, **kwargs):
        """This is warpper docstring"""
        print('args parameter: {}'.format(args))
        print('kwargs parameter： {}'.format(kwargs))
        # func(*args, **kwargs)
        # 返回装饰器函数的值
        return func(*args, **kwargs)
    return warpper


@dec_func
def func(*args, **kwargs):
    """This is func docstring"""

    sum_val = 0
    for i in args:
        sum_val += i

    print('in func, kwargs: {}'.format(kwargs))
    return sum_val


def main():
    foo()
    print('foo.__name__: {}, foo.__doc__: {}'.format(foo.__name__, foo.__doc__))

    example()
    print('example.__name__: {}, example.__doc__: {}'.format(example.__name__, example.__doc__))

    sum_val = func(*[1,2,3,4,5], **{'age':10, 'city':'beijing'})
    print('in main, sum_val: {}'.format(sum_val))



if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
