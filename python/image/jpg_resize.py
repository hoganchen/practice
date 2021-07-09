# -*- coding:utf-8 -*-
"""
@Author:        hogan.chen@ymail.com
@Create Date:   2020-10-02
"""

import os
import time
import math
import logging
import datetime

from glob import glob
from PIL import Image

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


def resize_images(source_dir, target_dir, threshold):
    filenames = glob('{}/*'.format(source_dir))
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)
    for filename in filenames:
        filesize = os.path.getsize(filename)
        if filesize >= threshold:
            print(filename)
            with Image.open(filename) as im:
                width, height = im.size
                if width >= height:
                    new_width = int(math.sqrt(threshold/2))
                    new_height = int(new_width * height * 1.0 / width)
                else:
                    new_height = int(math.sqrt(threshold/2))
                    new_width = int(new_height * width * 1.0 / height)
                resized_im = im.resize((new_width, new_height))
                output_filename = filename.replace(source_dir, target_dir)
                resized_im.save(output_filename)


def generate_thumbnail(source_file, threshold, suffix_list=None):
    file_list = []
    if os.path.exists(source_file):
        if os.path.isfile(source_file):
            file_list.append(source_file)
        else:
            if suffix_list is None:
                file_list.extend(glob.glob(os.path.join(source_file, '*')))
            else:
                for suffix_name in suffix_list:
                    file_list.extend(glob.glob(os.path.join(source_file, '*.{}'.format(suffix_name))))

        for file_name in file_list:
            with Image.open(file_name) as im:
                width, height = im.size
                if width >= height:
                    new_width = int(math.sqrt(threshold/2))
                    new_height = int(new_width * height * 1.0 / width)
                else:
                    new_height = int(math.sqrt(threshold/2))
                    new_width = int(new_height * width * 1.0 / height)
                resized_im = im.resize((new_width, new_height))
                file_basename_list = os.path.splitext(os.path.basename(file_name))
                output_filename = os.path.join(os.path.dirname(file_name), '{}_thumb.{}'.format(file_basename_list[0], file_basename_list[1]))
                resized_im.save(output_filename)


def main():
    pass


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
