# -*- coding:utf-8 -*-

"""
@Author:        hogan.chen@ymail.com
@Create Date:   8/13/21
"""

import time
import logging
import datetime
from selenium import webdriver
from selenium.webdriver.firefox.options import Options

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


def chrome_example():
    """
    错误解决
    selenium.common.exceptions.WebDriverException: Message: 'chromedriver' executable needs to be in PATH.

    ubuntu:
    sudo apt-get update
    sudo apt-get install chromium-chromedriver
    """
    # 创建Chrome浏览器设置变量
    chrome_options = webdriver.ChromeOptions()
    # 无界面模式
    chrome_options.add_argument('--headless')

    # 不加载图片
    prefs = {"profile.managed_default_content_settings.images": 2}

    chrome_options.add_experimental_option("prefs", prefs)

    # 实例化Chrome driver
    driver = webdriver.Chrome(chrome_options=chrome_options)

    # 打开百度
    driver.get("https://www.baidu.com/")
    # 截屏,文件保存为baidu.png
    driver.save_screenshot("baidu.png")


def firefox_example():
    """
    错误解决
    selenium.common.exceptions.WebDriverException: Message: 'geckodriver' executable needs to be in PATH.

    ubuntu:
    sudo apt-get update
    sudo apt-get install firefox-geckodriver
    """
    options = Options()
    options.headless = True

    firefox_profile = webdriver.FirefoxProfile()

    # https://blog.51cto.com/u_15069487/2581359
    # 禁用css样式，页面排版会变丑。
    # firefox_profile.set_preference('permissions.default.stylesheet', 2)

    # 禁止加载图片
    firefox_profile.set_preference('permissions.default.image', 2)

    # 禁止flash
    firefox_profile.set_preference('dom.ipc.plugins.enabled.libflashplayer.so', 'false')

    driver = webdriver.Firefox(options=options, firefox_profile=firefox_profile)
    # driver = webdriver.Firefox(options=options)

    # 打开百度
    driver.get("https://www.baidu.com/")
    # 截屏,文件保存为baidu.png
    driver.save_screenshot("baidu.png")


def main():
    # chrome_example()
    firefox_example()


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
