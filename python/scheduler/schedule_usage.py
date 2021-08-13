# -*- coding:utf-8 -*-

"""
@Author:        hogan.chen@ymail.com
@Create Date:   8/13/21
"""

import time
import logging
import datetime
import schedule
import threading

# log level
LOGGING_LEVEL = logging.INFO


def logging_config(logging_level):
    # log_format = "%(asctime)s - %(levelname)s - %(message)s"
    # log_format = "%(asctime)s [line: %(lineno)d] - %(levelname)s - %(message)s"
    # log_format = "[File: %(filename)s line: %(lineno)d] - %(levelname)s - %(message)s"
    # log_format = "[%(asctime)s - [File: %(filename)s line: %(lineno)d] - %(levelname)s]: %(message)s"
    # log_format = "[Func: %(funcName)s - Line: %(lineno)d - Level: %(levelname)s]: %(message)s"
    # log_format = "[Datetime: %(asctime)s - Line: %(lineno)d - Level: %(levelname)s]: %(message)s"
    # log_format = "[Func: %(funcName)s - Line: %(lineno)d - Level: %(levelname)s]: %(message)s"

    # log_format = "[Time: %(asctime)s - Func: %(funcName)s - Line: %(lineno)d - Level: %(levelname)s]: %(message)s"
    log_format = "[Time: %(asctime)s - Line: %(lineno)d - Level: %(levelname)s]: %(message)s"
    logging.basicConfig(level=logging_level, format=log_format)


def func():
    now = datetime.datetime.now()
    ts = now.strftime('%Y-%m-%d %H:%M:%S')
    print('do func  time :', ts)


def func2():
    now = datetime.datetime.now()
    ts = now.strftime('%Y-%m-%d %H:%M:%S')
    print('do func2 time：', ts)


def run_threaded(job_func):
    job_thread = threading.Thread(target=job_func)
    job_thread.start()


def run_schedule_in_thread():
    def run_continuously(self, interval=1):
        """Continuously run, while executing pending jobs at each elapsed
        time interval.
        @return cease_continuous_run: threading.Event which can be set to
        cease continuous run.
        Please note that it is *intended behavior that run_continuously()
        does not run missed jobs*. For example, if you've registered a job
        that should run every minute and you set a continuous run interval
        of one hour then your job won't be run 60 times at each interval but
        only once.
        """
        cease_continuous_run = threading.Event()

        class ScheduleThread(threading.Thread):
            @classmethod
            def run(cls):
                while not cease_continuous_run.is_set():
                    self.run_pending()
                    time.sleep(interval)

        continuous_thread = ScheduleThread()
        continuous_thread.start()
        return cease_continuous_run


def task_list_with_thread():
    """
    https://zhuanlan.zhihu.com/p/92152648

    schedule.every(10).minutes.do(job)               # 每隔 10 分钟运行一次 job 函数
    schedule.every().hour.do(job)                    # 每隔 1 小时运行一次 job 函数
    schedule.every().day.at("10:30").do(job)         # 每天在 10:30 时间点运行 job 函数
    schedule.every().monday.do(job)                  # 每周一 运行一次 job 函数
    schedule.every().wednesday.at("13:15").do(job)   # 每周三 13：15 时间点运行 job 函数
    schedule.every().minute.at(":17").do(job)        # 每分钟的 17 秒时间点运行 job 函数

    schedule 常见问题

    1、如何并行执行任务？
    schedule 是阻塞式的，默认情况下， schedule 按顺序执行所有的作业，不能达到并行执行任务。
    如果需要实现并行，那么使用多线程方式运行任务

    2、如何在不阻塞主线程的情况下连续运行调度程序？
    官方推荐了这个方式，在单独的线程中运行调度程序，如下，在单独的线程中运行 run_pending 调度程序。通过 threading 库的 Event 来实现
    """

    # 清空任务
    schedule.clear()
    # 创建一个按秒间隔执行任务
    schedule.every(1).seconds.do(run_threaded, func)
    # 创建一个按2秒间隔执行任务
    schedule.every(2).seconds.do(run_threaded, func2)
    # 执行10S
    for i in range(10):
        # 执行pending的任务，但是如果把sleep修改为0.1，则所有任务都没有发生pending，导致没有任何打印退出，除非循环修改为while True
        schedule.run_pending()
        time.sleep(1)


def task_list():
    """
    https://justcode.ikeepstudying.com/2021/04/python3-%E5%AE%9A%E6%97%B6%E4%BB%BB%E5%8A%A1%E7%9A%84%E5%9B%9B%E7%A7%8D%E5%AE%9E%E7%8E%B0%E6%96%B9%E5%BC%8F-python-%E5%AE%9A%E6%97%B6%E4%BB%BB%E5%8A%A1-python-crontab-python-timer/

    执行过程分析：
        >1>因为在jupyter下执行，所以先将schedule任务清空；
        >2>按时间间在schedule中隔添加任务；
        >3>这里按照秒间隔添加func，按照两秒间隔添加func2;
        >4>schedule添加任务后，需要查询任务并执行任务；
        >5>为了防止占用资源，每秒查询到点任务，然后顺序执行；

    第5个顺序执行怎么理解，我们修改func函数，里面添加time.sleep(2)

    然后只执行func工作，输出结果：
        do func  time : 2019-03-22 09:00:59
        do func  time : 2019-03-22 09:01:02
        do func  time : 2019-03-22 09:01:05

    可以看到时间间隔为3S，为什么不是1S？
    因为这个按照顺序执行，func休眠2S，循环任务查询休眠1S，所以会存在这个问题。
    在我们使用这种方式执行任务需要注意这种阻塞现象。

    我们看下schedule模块常用使用方法：
    #schedule.every(1)创建Job, seconds.do(func)按秒间隔查询并执行
    schedule.every(1).seconds.do(func)
    #添加任务按分执行
    schedule.every(1).minutes.do(func)
    #添加任务按天执行
    schedule.every(1).days.do(func)
    #添加任务按周执行
    schedule.every().weeks.do(func)
    #添加任务每周1执行，执行时间为下周一这一时刻时间
    schedule.every().monday.do(func)
    #每周1，1点15开始执行
    schedule.every().monday.at("12:00").do(job)

    这种方式局限性：如果工作任务回非常耗时就会影响其他任务执行。我们可以考虑使用并发机制配置这个模块使用。
    """
    # 清空任务
    schedule.clear()
    # 创建一个按秒间隔执行任务
    schedule.every(1).seconds.do(func)
    # 创建一个按2秒间隔执行任务
    schedule.every(2).seconds.do(func2)
    # 执行10S
    for i in range(10):
        # 执行pending的任务，但是如果把sleep修改为0.1，则所有任务都没有发生pending，导致没有任何打印退出，除非循环修改为while True
        schedule.run_pending()
        time.sleep(1)


def main():
    # task_list()
    task_list_with_thread()


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
