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

flash_url_link_list = ('http://www.7k7k.com/tag/1819/hot.htm', 'http://www.7k7k.com/tag/1819/hot_2.htm',
                       'http://www.7k7k.com/tag/1819/hot_3.htm', 'http://www.7k7k.com/tag/1819/hot_4.htm')
# flash_url_link_list = ('http://www.7k7k.com/tag/2661/hot.htm', )

UserAgentList = [
    'Mozilla/5.0 (Windows NT 6.1; rv:28.0) Gecko/20100101 Firefox/28.0',
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
    '(KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36'
]

# log level
LOGGING_LEVEL = logging.INFO


def logging_config(logging_level):
    # log_format = "%(asctime)s - %(levelname)s - %(message)s"
    # log_format = "%(asctime)s [line: %(lineno)d] - %(levelname)s - %(message)s"
    log_format = "[%(asctime)s - [File: %(filename)s line: %(lineno)d] - %(levelname)s]: %(message)s"
    logging.basicConfig(level=logging_level, format=log_format)


def download_swf(file_name, swf_link):
    try:
        ropen = urllib.request.urlopen(swf_link).read()

        with open(file_name, 'wb') as fd:
            fd.write(ropen)
            """
            for chunk in ropen.read():
                fd.write(chunk)
            """
            fd.close()
    except Exception as err:
        logging.warning('Warning: can not download {} file from link {}, the error information: {}'.
                        format(file_name, swf_link, err))


def get_swf_link(swf_url_link):
    host = ''
    match_obj = re.match(r'^http[s]*://([^/]*)', swf_url_link)

    if match_obj:
        host = match_obj.group(1)

    header = {
        'Host': host,
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

    try:
        url_request = urllib.request.Request(swf_url_link, headers=header)
        url_open = urllib.request.urlopen(url_request, timeout=5)

        html_doc = url_open.read()
        html_doc = gzip.decompress(html_doc).decode('utf-8')
    except Exception as err:
        logging.warning('Warning: Can not open link {}, the error information: {}'.format(swf_url_link, err))
    else:
        logging.debug(html_doc)
        file_name = None
        swf_download_link = None
        swf_back2back_link = None

        file_match_obj = re.search('_gamename\s*=\s*\"(.*?)\"', html_doc)
        if file_match_obj:
            file_name = file_match_obj.group(1)

        url_match_obj = re.search('_gamepath\s*=\s*\"([^\"]+)\"', html_doc)
        if url_match_obj:
            swf_download_link = url_match_obj.group(1)

        b2b_url_match_obj = re.search('_gamespecialpath\s*=\s*\"([^\"]+)\"', html_doc)
        if b2b_url_match_obj:
            swf_back2back_link = url_match_obj.group(1)

        if file_name is not None and swf_download_link is not None:
            if not re.search(r'.swf$', swf_download_link):
                if swf_back2back_link is not None and re.search(r'.swf$', swf_back2back_link):
                    swf_download_link = swf_back2back_link
                else:
                    # swf_download_link = swf_download_link.replace('html', 'swf')
                    swf_download_link = re.sub(r'_\d+(.\w+)$', r'\g<1>', swf_download_link)
                    swf_download_link = re.sub(r'.\w+$', '.swf', swf_download_link)

            logging.info('file_name: {}, swf_download_link: {}'.format(file_name, swf_download_link))
            download_swf('{}.swf'.format(file_name), swf_download_link)


def get_flash_link(url_link_list):
    for url_link in url_link_list:
        host = ''
        url_host = ''
        match_obj = re.match(r'^(http[s]*://)([^/]*)', url_link)

        if match_obj:
            host = match_obj.group(2)
            url_host = '{}{}'.format(match_obj.group(1), match_obj.group(2))

        header = {
            'Host': host,
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

        logging.debug('\n\n\n\n\n############################################################'
                      '############################################################')

        bt_soup = BeautifulSoup(html_doc, 'html.parser')
        bt_soup_find_content = bt_soup.find_all('div', 'box-bd box-bd-s')
        logging.debug(type(bt_soup_find_content))

        match_obj = re.findall(r'<a class=\"li-top-a\" href=\"(.*?)\"', str(bt_soup_find_content))

        if match_obj:
            for url_str in match_obj:
                swf_url_link = '{}/{}'.format(url_host, url_str.replace('flash', 'swf'))

                logging.info('Start to download swf from link {}'.format(swf_url_link))
                get_swf_link(swf_url_link)


def show_url_content(url_link):
    host = ''
    match_obj = re.match(r'^(http[s]*://)([^/]*)', url_link)

    if match_obj:
        host = match_obj.group(2)

    header = {
        'Host': host,
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
    logging.info(html_doc)


def main():
    logging_config(LOGGING_LEVEL)

    get_flash_link(flash_url_link_list)
    # show_url_content('http://flash.7k7k.com/cms/cms10/20120217/1648567588/T85703/back2back.html')
    # show_url_content('http://www.7k7k.com/swf/189028.htm')


if __name__ == "__main__":
    print("Script start execution at {}".format(str(datetime.datetime.now())))

    time_start = time.time()
    main()

    print("\n\nTotal Elapsed Time: {} seconds".format(time.time() - time_start))
    print("\nScript end execution at {}".format(datetime.datetime.now()))
