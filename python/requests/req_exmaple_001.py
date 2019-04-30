# -*- coding:utf-8 -*-
'''
@Author:        hogan.chen@ymail.com
@Create Date:   2019-04-30
'''
import time
import logging
import datetime
import requests

# log level
LOGGING_LEVEL = logging.INFO


def logging_config(logging_level):
    # log_format = '%(asctime)s - %(levelname)s - %(message)s'
    # log_format = '%(asctime)s [line: %(lineno)d] - %(levelname)s - %(message)s'
    # log_format = '[File: %(filename)s line: %(lineno)d] - %(levelname)s - %(message)s'
    # log_format = '[%(asctime)s - [File: %(filename)s line: %(lineno)d] - %(levelname)s]: %(message)s'

    # log_format = '[Datetime: %(asctime)s -- Line: %(lineno)d -- Level: %(levelname)s]: %(message)s'
    # log_format = '[Time: %(asctime)s -- Func: %(funcName)s -- Line: %(lineno)d -- Level: %(levelname)s]: %(message)s'
    log_format = '[Func: %(funcName)s - Line: %(lineno)d - Level: %(levelname)s]: %(message)s'
    logging.basicConfig(level=logging_level, format=log_format)


def get_gif_content():
    html_req = requests.get('https://raw.githubusercontent.com/microsoft/vscode-python/master/images/ConfigureDebugger.gif')
    logging.info('cookies: {}\nelapsed: {}\n'.format(html_req.cookies, html_req.elapsed))
    logging.info('encoding: {}\nheaders: {}\n'.format(html_req.encoding, html_req.headers))
    logging.info('raw: {}\nreason: {}\nstatus_code: {}\nurl: {}\n'.format(
            html_req.raw, html_req.reason, html_req.status_code, html_req.url))

    with open('conf.gif', 'wb') as gif_fd:
        gif_fd.write(html_req.content)


def main():
    get_gif_content()


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    logging.info('Script start execution at {}'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()

    logging.info('Total elapsed time: {} seconds'.format(time.time() - time_start))
    logging.info('Script end execution at {}'.format(datetime.datetime.now()))
