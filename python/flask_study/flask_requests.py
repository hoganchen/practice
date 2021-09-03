# -*- coding:utf-8 -*-

"""
@Author:        hogan.chen@ymail.com
@Create Date:   9/2/21
"""

import time
import logging
import datetime
from flask import Flask, request, render_template

app = Flask(__name__)
app.secret_key = 'secret string'

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


@app.route('/')
def index():
    header = {
        'accept': request.headers.get('Accept'),
        'encoding': request.headers.get('Accept-Encoding'),
        'language': request.headers.get('Accept-Language'),
        'cookie': request.headers.get('Cookie'),
        'host': request.headers.get('Host'),
        'referer': request.headers.get('Referer'),
        'agent': request.headers.get('User-Agent'),
    }
    return render_template('index.html', header=header)


# export FLASK_APP=flask_requests; condapython -m flask run --port=8000
def main():
    app.run(debug=True)


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
