# -*- coding:utf-8 -*-

"""
@Author:        hogan.chen@ymail.com
@Create Date:   2019-01-12
"""

import time
import random
import logging
import datetime
import numpy as np
import matplotlib.pyplot as plt


MAX_THREAD_NUM = 10

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


def matplotlib_example_01():
    x_list = [random.randint(80, 120) for _ in range(100)]
    x_array = np.array(x_list)

    plt.plot(x_array)
    # plt.scatter(range(len(x_list)), x_array)
    plt.show()


def matplotlib_example_02():
    mu, sigma = 100, 15
    x_array = mu + sigma * np.random.randn(10000)

    '''
    https://blog.csdn.net/u012111465/article/details/79375897
    normed :normed=True是频率图，默认是频数图, Deprecated; use the density keyword argument instead.
    range :筛选数据范围，默认是最小到最大的取值范围
    histtype:hist柱子类型
    orientation:水平或垂直方向
    rwidth= :柱子与柱子之间的距离，默认是0
    '''
    # n, bins, patches = plt.hist(x_array, 50, density=True, facecolor='g', alpha=0.75)
    n, bins, patches = plt.hist(x_array, 50, density=True, rwidth=0.8, facecolor='g', edgecolor='r', alpha=0.75)
    plt.xlabel('Smarts')
    plt.ylabel('Probability')
    plt.title('Histogram of IQ')
    plt.text(60, .025, r'$\mu=100,\ \sigma=15$')
    plt.axis([40, 160, 0, 0.03])
    plt.grid(True)
    plt.show()


def matplotlib_example_03():
    """
    http://codingpy.com/article/a-quick-intro-to-matplotlib/

    上面的代码大量的用到了 np.random.rand(1000)，原因是我们绘图的数据都是随机产生的。

    同前面一样我们用到了 scatter() 函数，但是这次我们传入了另外的两个参数，分别为所绘点的大小和颜色。通过这种方式使得图上点的大小和颜色根据数据的大小产生变化。

    然后我们用 colorbar() 函数添加了一个颜色栏。
    """
    # 彩色映射散点图
    x = np.random.rand(1000)
    y = np.random.rand(1000)
    size = np.random.rand(1000) * 50
    colour = np.random.rand(1000)
    plt.scatter(x, y, size, colour)
    plt.colorbar()
    plt.show()


def main():
    matplotlib_example_01()
    matplotlib_example_02()
    matplotlib_example_03()


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)

    logging.info('Script start execution at {}'.format(str(datetime.datetime.now())))
    print('-' * 120)

    time_start = time.time()
    main()

    print('-' * 120)
    logging.info('Total elapsed time: {} seconds'.format(time.time() - time_start))
    logging.info('Script end execution at {}'.format(datetime.datetime.now()))
