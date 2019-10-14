# -*- coding:utf-8 -*-

"""
@Author:        hogan.chen@ymail.com
@Create Date:   2019-01-12
"""

import time
import logging
import datetime

# log level
LOGGING_LEVEL = logging.DEBUG


def logging_config(logging_level):
    # log_format = "%(asctime)s - %(levelname)s - %(message)s"
    # log_format = "%(asctime)s [line: %(lineno)d] - %(levelname)s - %(message)s"
    # log_format = "[%(asctime)s - [File: %(filename)s line: %(lineno)d] - %(levelname)s]: %(message)s"
    # log_format = "[Datetime: %(asctime)s -- Line: %(lineno)d -- Level: %(levelname)s]: %(message)s"
    log_format = "[Time: %(asctime)s - Func: %(funcName)s - Line: %(lineno)d - Level: %(levelname)s]: %(message)s"
    # log_format = "[Func: %(funcName)s - Line: %(lineno)d - Level: %(levelname)s]: %(message)s"
    logging.basicConfig(level=logging_level, format=log_format)


class Animal(object):
    def __init__(self, name):
        self.name = name

    def greet(self):
        print('Hello, I am %s.' % self.name)


class Dog(Animal):
    def greet(self):
        super(Dog, self).greet()   # Python3 可使用 super().greet()
        print('WangWang...')


class BaseClass(object):
    def __init__(self, a, b):
        self.a = a
        self.b = b


class AClass(BaseClass):
    def __init__(self, a, b, c):
        super(AClass, self).__init__(a, b)  # Python3 可使用 super().__init__(a, b)
        self.c = c

    def print_param(self):
        print('a: {}, b: {}, c: {}'.format(self.a, self.b, self.c))


class Base(object):
    def __init__(self):
        print("enter Base")
        print("leave Base")


class A(Base):
    def __init__(self):
        print("enter A")
        super(A, self).__init__()
        print("leave A")


class B(Base):
    def __init__(self):
        print("enter B")
        super(B, self).__init__()
        print("leave B")


class C(A, B):
    def __init__(self):
        print("enter C")
        super(C, self).__init__()
        print("leave C")


def main():
    dog = Dog('dog')
    dog.greet()

    a = AClass(1, 2, 3)
    a.print_param()

    '''
    https://python3-cookbook.readthedocs.io/zh_CN/latest/c08/p07_calling_method_on_parent_class.html
    http://funhacks.net/explore-python/Class/super.html
    https://www.runoob.com/python/python-func-super.html
    
如果你认为 super 代表『调用父类的方法』，那你很可能会疑惑为什么 enter A 的下一句不是 enter Base 而是 enter B。原因是，super 和父类没有实质性的关联，现在让我们搞清 super 是怎么运作的。
MRO 列表

事实上，对于你定义的每一个类，Python 会计算出一个方法解析顺序（Method Resolution Order, MRO）列表，它代表了类继承的顺序，我们可以使用下面的方式获得某个类的 MRO 列表：

>>> C.mro()   # or C.__mro__ or C().__class__.mro()
[__main__.C, __main__.A, __main__.B, __main__.Base, object]

那这个 MRO 列表的顺序是怎么定的呢，它是通过一个 C3 线性化算法来实现的，这里我们就不去深究这个算法了，感兴趣的读者可以自己去了解一下，总的来说，一个类的 MRO 列表就是合并所有父类的 MRO 列表，并遵循以下三条原则：

    子类永远在父类前面
    如果有多个父类，会根据它们在列表中的顺序被检查
    如果对下一个类存在两个合法的选择，选择第一个父类
    '''
    _ = C()
    print(C.__mro__)


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)

    logging.info('Script start execution at {}'.format(str(datetime.datetime.now())))
    print('-' * 120)

    time_start = time.time()
    main()

    print('-' * 120)
    logging.info('Total elapsed time: {} seconds'.format(time.time() - time_start))
    logging.info('Script end execution at {}'.format(datetime.datetime.now()))
