# -*- coding:utf-8 -*-

"""
@Author:        hogan.chen@ymail.com
@Create Date:   2019-03-25
@Update Date:   2019-03-25
@Version:       V0.9.20190325
"""

import re
import time
import gzip
import random
import logging
import datetime
import urllib.request
from bs4 import BeautifulSoup

# flash_url_link_list = ('http://www.7k7k.com/tag/2661/hot.htm', 'http://www.7k7k.com/tag/2661/hot_2.htm')
flash_url_link_list = ('http://www.7k7k.com/tag/2661/hot.htm', )

UserAgentList = ['Mozilla/5.0 (Windows NT 6.1; rv:28.0) Gecko/20100101 Firefox/28.0',
                 'Mozilla/5.0 (X11; Linux i686; rv:30.0) Gecko/20100101 Firefox/30.0',
                 'Mozilla/5.0 (Windows NT 5.1; rv:31.0) Gecko/20100101 Firefox/31.0',
                 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:33.0) Gecko/20100101 Firefox/33.0',
                 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:40.0) Gecko/20100101 Firefox/40.0',
                 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:57.0) Gecko/20100101 Firefox/57.0',
                 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)',
                 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0; SLCC2; Media Center PC 6.0; '
                 'InfoPath.3; MS-RTC LM 8; Zune 4.7)',
                 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)',
                 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)',
                 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Win64; x64; Trident/6.0)',
                 'Mozilla/5.0 (IE 11.0; Windows NT 6.3; Trident/7.0; .NET4.0E; .NET4.0C; rv:11.0) like Gecko',
                 'Mozilla/5.0 (IE 11.0; Windows NT 6.3; WOW64; Trident/7.0; Touch; rv:11.0) like Gecko',
                 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 '
                 '(KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36',
                 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 '
                 '(KHTML, like Gecko) Chrome/31.0.1623.0 Safari/537.36',
                 'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 '
                 '(KHTML, like Gecko) Chrome/34.0.1847.116 Safari/537.36',
                 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 '
                 '(KHTML, like Gecko) Chrome/37.0.2062.103 Safari/537.36',
                 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 '
                 '(KHTML, like Gecko) Chrome/40.0.2214.38 Safari/537.36',
                 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 '
                 '(KHTML, like Gecko) Chrome/46.0.2490.71 Safari/537.36',
                 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 '
                 '(KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36']

# log level
LOGGING_LEVEL = logging.DEBUG


def logging_config(logging_level):
    # log_format = "%(asctime)s - %(levelname)s - %(message)s"
    # log_format = "%(asctime)s [line: %(lineno)d] - %(levelname)s - %(message)s"
    log_format = "[%(asctime)s - [File: %(filename)s line: %(lineno)d] - %(levelname)s]: %(message)s"
    logging.basicConfig(level=logging_level, format=log_format)


def download_swf(swf_link, file_name):
    ropen = urllib.request.urlopen(swf_link).read()

    with open(file_name, 'wb') as fd:
        fd.write(ropen)
        """
        for chunk in ropen.read():
            fd.write(chunk)
        """
        fd.close()


def get_swf_link(swf_url_link):
    match_obj = re.match(r'^http[s]*://([^/]*)', swf_url_link)

    if match_obj:
        host = match_obj.group(1)

    header = {'Host': host,
        'User-Agent': random.choice(UserAgentList),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        # 'Accept-Encoding': 'gzip, deflate, sdch',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    }

    logging.debug(header)

    url_request = urllib.request.Request(swf_url_link, headers=header)
    url_open = urllib.request.urlopen(url_request, timeout=5)

    html_doc = url_open.read()
    html_doc = gzip.decompress(html_doc).decode('utf-8')


def get_flash_link(url_link_list):
    swf_link_list = []

    for url_link in url_link_list:
        match_obj = re.match(r'^http[s]*://([^/]*)', url_link)

        if match_obj:
            host = match_obj.group(1)

        header = {'Host': host,
            'User-Agent': random.choice(UserAgentList),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            # 'Accept-Encoding': 'gzip, deflate, sdch',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }

        logging.debug(header)

        url_request = urllib.request.Request(url_link, headers=header)
        url_open = urllib.request.urlopen(url_request, timeout=5)

        html_doc = url_open.read()
        html_doc = gzip.decompress(html_doc).decode('utf-8')
        logging.debug(html_doc)

        logging.debug('\n\n\n\n\n########################################################################################################################')

        bt_soup = BeautifulSoup(html_doc, 'html.parser')
        swf_link_str = bt_soup.find_all('div', 'box-bd box-bd-s')
        swf_link_str_list = list(swf_link_str)

        for swf_str in swf_link_str_list:
            logging.debug(str(swf_str))
            break

            match_obj = re.match(r'<a class="li-top-a" href="(.*?)"', str(swf_str))

            if match_obj:
                logging.debug(match_obj.group(1))


def main():
    logging_config(LOGGING_LEVEL)

    get_flash_link(flash_url_link_list)


if __name__ == "__main__":
    print("Script start execution at {}".format(str(datetime.datetime.now())))

    time_start = time.time()
    main()

    print("\n\nTotal Elapsed Time: {} seconds".format(time.time() - time_start))
    print("\nScript end execution at {}".format(datetime.datetime.now()))

