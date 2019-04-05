# -*- coding:utf-8 -*-

"""
@Author:        hogan.chen@ymail.com
@Create Date:   2019-04-04
@Update Date:   2019-04-04
@Version:       V0.9.20190404
"""

import re
import os
import time
import gzip
import random
import logging
import chardet
import datetime
import urllib.request
from bs4 import BeautifulSoup

FLASH_URL_LINK_LIST = ('http://www.qiaohule.com/qiaohuyouxi/youxi_2_1.html',
                       'http://www.qiaohule.com/qiaohuyouxi/youxi_2_2.html',
                       'http://www.qiaohule.com/qiaohuyouxi/youxi_2_3.html',
                       'http://www.qiaohule.com/qiaohuyouxi/youxi_2_4.html',
                       'http://www.qiaohule.com/qiaohuyouxi/youxi_2_5.html',
                       'http://www.qiaohule.com/ertonggushi/',
                       'http://www.qiaohule.com/qiaohutianse/',
                       )
# FLASH_URL_LINK_LIST = (
#                        'http://www.qiaohule.com/qiaohuyouxi/youxi_2_2.html',
#                        'http://www.qiaohule.com/qiaohuyouxi/youxi_2_3.html',
#                        'http://www.qiaohule.com/qiaohuyouxi/youxi_2_4.html',
#                        'http://www.qiaohule.com/qiaohuyouxi/youxi_2_5.html',
#                        'http://www.qiaohule.com/ertonggushi/',
#                        'http://www.qiaohule.com/qiaohutianse/',
#                        )
# FLASH_URL_LINK_LIST = ('http://www.qiaohule.com/ertonggushi/', )
FLASH_LINK = 'http://swf.qiaohule.com/swf/{}.swf'
FLASH_LOAD_LINK = 'http://www.qiaohule.com/{}/{}.html'

DOWNLOAD_RETRY_COUNT = 10

USER_AGENT_LIST = [
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
    flash_file_name = '{}.swf'.format(file_name)
    retry_count = 0

    while True:
        try:
            read_open = urllib.request.urlopen(swf_link).read()

            with open(flash_file_name, 'wb') as fd:
                fd.write(read_open)
                """
                for chunk in read_open.read():
                    fd.write(chunk)
                """
                fd.close()
            break
        except Exception as err:
            logging.warning('Warning: can not download {} file from link {}, the error information: {}'
                            .format(flash_file_name, swf_link, err))
            time.sleep(random.randint(1, 10))
            retry_count += 1

            if retry_count >= DOWNLOAD_RETRY_COUNT:
                logging.info('Can not download after retry {} time...'.format(DOWNLOAD_RETRY_COUNT))
                break


def get_swf_link(flash_link):
    swf_link = None
    host = ''
    match_obj = re.match(r'^(http[s]*://)([^/]*)', flash_link)

    if match_obj:
        host = match_obj.group(2)

    # header = {
    #     'Host': host,
    #     'User-Agent': random.choice(UserAgentList),
    #     'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    #     'Accept-Language': 'en-US,en;q=0.5',
    #     # 'Accept-Encoding': 'gzip, deflate, sdch',
    #     'Accept-Encoding': 'gzip, deflate',
    #     'DNT': '1',
    #     'Connection': 'keep-alive',
    #     'Upgrade-Insecure-Requests': '1',
    # }

    header = {
        # 'Host': 'www.qiaohule.com',
        'Host': host,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:66.0) Gecko/20100101 Firefox/66.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Referer': 'http://www.qiaohule.com/index.html',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Cookie': 'hibext_instdsigdipv2=1',
        'Upgrade-Insecure-Requests': '1',
    }

    logging.debug(header)

    url_request = urllib.request.Request(flash_link, headers=header)
    url_open = urllib.request.urlopen(url_request, timeout=5)

    html_doc = url_open.read()
    unzip_html_doc = gzip.decompress(html_doc)
    logging.debug(unzip_html_doc)

    chardet_dict = chardet.detect(unzip_html_doc)
    logging.debug(chardet_dict)

    match_obj = re.search(r'data=\"(http://swf.qiaohule.com/swf/.*?.swf)\"', str(unzip_html_doc))

    if match_obj:
        swf_link = match_obj.group(1)
        logging.debug('swf link: {}'.format(swf_link))

    return swf_link


def get_and_download_swf(url_link_list):
    for url_link in url_link_list:
        host = ''
        match_obj = re.match(r'^(http[s]*://)([^/]*)', url_link)

        if match_obj:
            host = match_obj.group(2)

        # header = {
        #     'Host': host,
        #     'User-Agent': random.choice(UserAgentList),
        #     'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        #     'Accept-Language': 'en-US,en;q=0.5',
        #     # 'Accept-Encoding': 'gzip, deflate, sdch',
        #     'Accept-Encoding': 'gzip, deflate',
        #     'DNT': '1',
        #     'Connection': 'keep-alive',
        #     'Upgrade-Insecure-Requests': '1',
        # }

        header = {
            # 'Host': 'www.qiaohule.com',
            'Host': host,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:66.0) Gecko/20100101 Firefox/66.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Referer': 'http://www.qiaohule.com/index.html',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Cookie': 'hibext_instdsigdipv2=1',
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
        bt_soup_find_content = bt_soup.find_all('ul', 'e14')
        logging.debug('type(bt_soup_find_content): {}'.format(type(bt_soup_find_content)))
        logging.debug('bt_soup_find_content:\n{}'.format(bt_soup_find_content))

        match_obj = re.findall(r'a\s*class=\"title\"\s*href=\"/(.*?)/(.*?).html"\s*target=\"_blank\">(.*?)</a>',
                               str(bt_soup_find_content))

        if match_obj:
            for url_match_tuple in match_obj:
                swf_folder_path = os.path.join('qiaohu', url_match_tuple[0])
                swf_file_path = os.path.join(swf_folder_path, url_match_tuple[2].replace('?', ''))

                if not os.path.exists(swf_folder_path):
                    os.makedirs(swf_folder_path)

                flash_download_link = get_swf_link(FLASH_LOAD_LINK.format(url_match_tuple[0], url_match_tuple[1]))
                logging.info('Start to download {}.swf from link {}'.format(swf_file_path, flash_download_link))

                download_swf(swf_file_path, flash_download_link)


def get_and_download_flash(url_link_list):
    for url_link in url_link_list:
        host = ''
        match_obj = re.match(r'^(http[s]*://)([^/]*)', url_link)

        if match_obj:
            host = match_obj.group(2)

        # header = {
        #     'Host': host,
        #     'User-Agent': random.choice(UserAgentList),
        #     'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        #     'Accept-Language': 'en-US,en;q=0.5',
        #     # 'Accept-Encoding': 'gzip, deflate, sdch',
        #     'Accept-Encoding': 'gzip, deflate',
        #     'DNT': '1',
        #     'Connection': 'keep-alive',
        #     'Upgrade-Insecure-Requests': '1',
        # }

        header = {
            # 'Host': 'www.qiaohule.com',
            'Host': host,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:66.0) Gecko/20100101 Firefox/66.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Referer': 'http://www.qiaohule.com/index.html',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Cookie': 'hibext_instdsigdipv2=1',
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
        bt_soup_find_content = bt_soup.find_all('ul', 'e14')
        logging.debug('type(bt_soup_find_content): {}'.format(type(bt_soup_find_content)))
        logging.debug('bt_soup_find_content:\n{}'.format(bt_soup_find_content))

        match_obj = re.findall(r'a\s*class=\"title\"\s*href=\"/(.*?)/(.*?).html"\s*target=\"_blank\">(.*?)</a>',
                               str(bt_soup_find_content))

        if match_obj:
            for url_match_tuple in match_obj:
                swf_folder_path = os.path.join('qiaohu', url_match_tuple[0])
                swf_file_path = os.path.join(swf_folder_path, url_match_tuple[2])

                if not os.path.exists(swf_folder_path):
                    os.makedirs(swf_folder_path)

                flash_download_link = FLASH_LINK.format(url_match_tuple[1])
                logging.info('Start to download {}.swf from link {}'.format(swf_file_path, flash_download_link))

                download_swf(swf_file_path, flash_download_link)


def show_url_content(url_link):
    host = ''
    match_obj = re.match(r'^(http[s]*://)([^/]*)', url_link)

    if match_obj:
        host = match_obj.group(2)

    header = {
        'Host': host,
        'User-Agent': random.choice(USER_AGENT_LIST),
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
    unzip_html_doc = gzip.decompress(html_doc)
    logging.info(unzip_html_doc)

    chardet_dict = chardet.detect(unzip_html_doc)
    logging.info(chardet_dict)

    match_obj = re.search(r'data=\"(http://swf.qiaohule.com/swf/.*?.swf)\"', str(unzip_html_doc))

    if match_obj:
        logging.info('swf link: {}'.format(match_obj.group(1)))

    decode_html_doc = gzip.decompress(html_doc).decode('utf-8')
    # decode_html_doc = gzip.decompress(html_doc).decode('Windows-1254')
    # decode_html_doc = gzip.decompress(html_doc).decode(chardet_dict['encoding'])
    logging.info(decode_html_doc)


def main():
    logging_config(LOGGING_LEVEL)

    # get_and_download_flash(FLASH_URL_LINK_LIST)
    get_and_download_swf(FLASH_URL_LINK_LIST)

    # show_url_content('http://www.qiaohule.com/qiaohuyouxi/youxi_2_1.html')
    # show_url_content('http://www.qiaohule.com/ertonggushi/')
    # show_url_content('http://www.qiaohule.com/qiaohutianse/')
    # show_url_content('http://www.qiaohule.com/qiaohuyouxi/1780.html')


if __name__ == "__main__":
    print("Script start execution at {}".format(str(datetime.datetime.now())))

    time_start = time.time()
    main()

    print("\n\nTotal Elapsed Time: {} seconds".format(time.time() - time_start))
    print("\nScript end execution at {}".format(datetime.datetime.now()))
