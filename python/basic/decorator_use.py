# -*- coding:utf-8 -*-
"""
@Author:        hogan.chen@ymail.com
@Create Date:   2020-10-02
"""

import time
import logging
import datetime

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


'''
使用装饰器极大地复用了代码，但是他有一个缺点就是原函数的元信息不见了，比如函数的docstring、__name__、参数列表

不难发现，函数 f 被with_logging取代了，当然它的docstring，__name__就是变成了with_logging函数的信息了。好在我们有functools.wraps，wraps本身也是一个装饰器，它能把原函数的元信息拷贝到装饰器里面的 func 函数中，这使得装饰器里面的 func 函数也有和原函数 foo 一样的元信息了。
'''
from functools import wraps
def logged(func):
    @wraps(func)
    def with_logging(*args, **kwargs):
        print('func name: {}'.format(func.__name__))    # 输出 'f'
        print('func doc: {}'.format(func.__doc__))      # 输出 'does some math'
        return func(*args, **kwargs)

    return with_logging


@logged
def f(x):
   """does some math"""
   return x + x * x


'''
类装饰器

没错，装饰器不仅可以是函数，还可以是类，相比函数装饰器，类装饰器具有灵活度大、高内聚、封装性等优点。使用类装饰器主要依靠类的__call__方法，当使用 @ 形式将装饰器附加到函数上时，就会调用此方法。
'''
class Foo(object):
    def __init__(self, func):
        self._func = func

    def __call__(self):
        print('class decorator runing')
        self._func()
        print('class decorator ending')


@Foo
def bar():
    print('bar')


'''
装饰器还有更大的灵活性，例如带参数的装饰器，在上面的装饰器调用中，该装饰器接收唯一的参数就是执行业务的函数 foo 。装饰器的语法允许我们在调用时，提供其它参数，比如@decorator(a)。这样，就为装饰器的编写和使用提供了更大的灵活性。比如，我们可以在装饰器中指定日志的等级，因为不同业务函数可能需要的日志级别是不一样的。

use_logging 是允许带参数的装饰器。它实际上是对原有装饰器的一个函数封装，并返回一个装饰器。我们可以将它理解为一个含有参数的闭包。当我 们使用@use_logging(level="warn")调用的时候，Python 能够发现这一层的封装，并把参数传递到装饰器的环境中。

@use_logging(level="warn")等价于@decorator
'''
def use_logging(level):
    def decorator(func):
        def wrapper(*args, **kwargs):
            if level == "warn":
                logging.warn("%s is running" % func.__name__)
            elif level == "info":
                logging.info("%s is running" % func.__name__)
            return func(*args, **kwargs)
        return wrapper

    return decorator


@use_logging(level="warn")
def foo_param(name='foo'):
    print("i am %s" % name)


# 简单装饰器
def dec_foo(func):
    def inner():
        print('Begin to call {} func...'.format(func.__name__))
        func()
        print('End to call {} func...'.format(func.__name__))
    return inner


@dec_foo
def foo():
    print('This is foo function...')


def dec_func(func):
    def inner(*args, **kwargs):
        print('args parameter: {}'.format(args))
        print('kwargs parameter： {}'.format(kwargs))
        # func(*args, **kwargs)
        # 返回装饰器函数的值
        return func(*args, **kwargs)
    return inner


@dec_func
def func(*args, **kwargs):
    sum_val = 0
    for i in args:
        sum_val += i

    print('in func, kwargs: {}'.format(kwargs))
    return sum_val


def main():
    foo()
    sum_val = func(*[1,2,3,4,5], **{'age':10, 'city':'beijing'})
    print('in main, sum_val: {}'.format(sum_val))

    ret = f(10)
    print('in main, ret: {}'.format(ret))

    bar()

    foo_param()


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
