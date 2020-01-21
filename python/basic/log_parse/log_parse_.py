# -*- coding:utf-8 -*-

import time
import random
import logging
import datetime
import binascii

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


def parse_sdk_log(raw_event_data):
    temp_raw_event_data = raw_event_data[:]
    sdk_log_str = ''

    while True:
        log_header_pos = temp_raw_event_data.find('ff0000')
        bb_header_pos = temp_raw_event_data.find('bb')
        cc_header_pos = temp_raw_event_data.find('cc')
        dd_header_pos = temp_raw_event_data.find('dd')
        log_flag = False

        if -1 == log_header_pos and -1 == bb_header_pos and -1 == cc_header_pos and -1 == dd_header_pos:
            break

        pos_list = [log_header_pos, bb_header_pos, cc_header_pos, dd_header_pos]
        min_flag = True

        for pos_var in pos_list:
            if min_flag:
                if pos_var >= 0:
                    min_value = pos_var
                    min_flag = False
            else:
                if pos_var < min_value and pos_var >= 0:
                    min_value = pos_var

        if min_value == log_header_pos:
            log_flag = True

        # print(log_header_pos, bb_header_pos, cc_header_pos, dd_header_pos, min_value, log_flag)

        header_len_str = temp_raw_event_data[min_value + 6: min_value + 10]
        le_header_len_str = header_len_str[2:] + header_len_str[:2]
        header_len = int(le_header_len_str, 16)

        if log_flag:
            sdk_log_str += temp_raw_event_data[min_value + 10: min_value + 10 + header_len * 2]

        temp_raw_event_data = temp_raw_event_data[min_value + 10 + header_len * 2:]
        # print(temp_raw_event_data)

    # print(sdk_log_str)
    # print(binascii.a2b_hex(sdk_log_str).decode('utf-8', 'ignore'))
    return sdk_log_str


def find_min(pos_list):
    min_flag = True

    for pos_var in pos_list:
        if min_flag:
            if pos_var >= 0:
                min_value = pos_var
                min_flag = False
        else:
            if pos_var < min_value and pos_var >= 0:
                min_value = pos_var


    print('list: {}'.format(pos_list))
    print('min value: {}'.format(min_value))

    return min_value


def main():
    log_hex_str = '''ff000046005b524f4d5d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d20444247204c4f4720494e4954205355434345535321202d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d0d0a39ff00002a00533a2d2d2d2d2d2d2d20444247204c4f4720494e4954205355434345535321202d2d2d2d2d2d2d2d0d0ad3ff00002300533a69276d2066726f6d2073646b2c20616464726573733d3078313030646538390d0a25ff00001a00533a353a6e7664735f70757428292073616d6520646174610d0a90ff00001a00533a353a6e7664735f70757428292073616d6520646174610d0a90ff00001400533a5b53444b5d626c655f73646b5f696e69740ad5ff00001400533a313a4f503a5245534554202830783031290a15ff00002a00533a313a52656376204576656e743a434d505f4556542c20637572725f73746174653a434f4e4649470a43ff00001a00533a313a4f503a307830312c207374617475733a307830300a0ac7ff00001500533a313a4f503a5345545f574c202830783930290aa1ff00000b00533a313a4e554d3a20300a7aff00002a00533a313a52656376204576656e743a434d505f4556542c20637572725f73746174653a434f4e4649470a43ff00001a00533a313a4f503a307839302c207374617475733a307830300a0abfff00001000533a313a6e756d2073746172743a300ae7ff00001600533a313a4f503a5345545f52414c202830783931290a63ff00000a00533a313a4e554d3a300a9bff00002a00533a313a52656376204576656e743a434d505f4556542c20637572725f73746174653a434f4e4649470a43ff00001a00533a313a4f503a307839312c207374617475733a307830300a0abeff00001600533a313a4f503a5345545f50414c202830783932290a64ff00000a00533a313a4e554d3a300a9bff00002a00533a313a52656376204576656e743a434d505f4556542c20637572725f73746174653a434f4e4649470a43ff00001a00533a313a4f503a307839322c207374617475733a307830300a0abdff00001c005b4150505d626c6520737461636b206973207265616479210d0a0d0a63ff00001d00533a313a6c6570736d5f7265673a2063757272656e74206e756d20300a07cc000201000031ff00003200533a343a626c655f6c326361705f6c6563625f63625f726567697374657220656e7465722c206c655f70736d203d2033370a98ff00000f00533a343a63625f6e756d203d20310acbff000026005b4150505d5b474154545d5b626c655f746f6f6c5f676174745f696e69745d656e746572210ae7dd01021f00665544332211007fc307010100ff0000000c0002010408086c6f635f6c777936dd01021f00665544332211007fc907010100ff0000000c0002010408086c6f635f6c777930dd01021f00665544332211007fc307010100ff0000000c0002010408086c6f635f6c777936dd01021c00665544332211007fc307030100ff000000090008087265735f6c777935dd01021f00665544332211007fc907010100ff0000000c0002010408086c6f635f6c777930dd01021f00665544332211007fc907010100ff0000000c0002010408086c6f635f6c777930dd01021f00665544332211007fc907010100ff0000000c0002010408086c6f635f6c777930dd01021f00665544332211007fc307010100ff0000000c0002010408086c6f635f6c777936dd01021c00665544332211007fc307030100ff000000090008087265735f6c777935dd01021f00665544332211007fca07010100ff0000000c0002010408086c6f635f6c77792f'''

    log_hex_str = '''ff000046005b524f4d5d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d20444247204c4f4720494e4954205355434345535321202d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d0d0a39ff00002a00533a2d2d2d2d2d2d2d20444247204c4f4720494e4954205355434345535321202d2d2d2d2d2d2d2d0d0ad3ff00002300533a69276d2066726f6d2073646b2c20616464726573733d3078313030646538390d0a25ff00001a00533a353a6e7664735f70757428292073616d6520646174610d0a90ff00001a00533a353a6e7664735f70757428292073616d6520646174610d0a90ff00001400533a5b53444b5d626c655f73646b5f696e69740ad5ff00001400533a313a4f503a5245534554202830783031290a15ff00002a00533a313a52656376204576656e743a434d505f4556542c20637572725f73746174653a434f4e4649470a43ff00001a00533a313a4f503a307830312c207374617475733a307830300a0ac7ff00001500533a313a4f503a5345545f574c202830783930290aa1ff00000b00533a313a4e554d3a20300a7aff00002a00533a313a52656376204576656e743a434d505f4556542c20637572725f73746174653a434f4e4649470a43ff00001a00533a313a4f503a307839302c207374617475733a307830300a0abfff00001000533a313a6e756d2073746172743a300ae7ff00001600533a313a4f503a5345545f52414c202830783931290a63ff00000a00533a313a4e554d3a300a9bff00002a00533a313a52656376204576656e743a434d505f4556542c20637572725f73746174653a434f4e4649470a43ff00001a00533a313a4f503a307839312c207374617475733a307830300a0abeff00001600533a313a4f503a5345545f50414c202830783932290a64ff00000a00533a313a4e554d3a300a9bff00002a00533a313a52656376204576656e743a434d505f4556542c20637572725f73746174653a434f4e4649470a43ff00001a00533a313a4f503a307839322c207374617475733a307830300a0abdff00001c005b4150505d626c6520737461636b206973207265616479210d0a0d0a63ff00001d00533a313a6c6570736d5f7265673a2063757272656e74206e756d20300a07cc000201000031ff00003200533a343a626c655f6c326361705f6c6563625f63625f726567697374657220656e7465722c206c655f70736d203d2033370a98ff00000f00533a343a63625f6e756d203d20310acbff000026005b4150505d5b474154545d5b626c655f746f6f6c5f676174745f696e69745d656e746572210ae7dd01021f00665544332211007fc307010100ff0000000c0002010408086c6f635f6c777936ff000046005b524f4d5d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d20444247204c4f4720494e4954205355434345535321202d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d0d0a39dd01021f00665544332211007fc907010100ff0000000c0002010408086c6f635f6c777930dd01021f00665544332211007fc307010100ff0000000c0002010408086c6f635f6c777936dd01021c00665544332211007fc307030100ff000000090008087265735f6c777935dd01021f00665544332211007fc907010100ff0000000c0002010408086c6f635f6c777930dd01021f00665544332211007fc907010100ff0000000c0002010408086c6f635f6c777930dd01021f00665544332211007fc907010100ff0000000c0002010408086c6f635f6c777930dd01021f00665544332211007fc307010100ff0000000c0002010408086c6f635f6c777936dd01021c00665544332211007fc307030100ff000000090008087265735f6c777935dd01021f00665544332211007fca07010100ff0000000c0002010408086c6f635f6c77792f'''

    log_handle_str = log_hex_str
    log_str = ''

    while True:
        log_header_pos = log_handle_str.find('ff0000')
        bb_header_pos = log_handle_str.find('bb')
        cc_header_pos = log_handle_str.find('cc')
        dd_header_pos = log_handle_str.find('bb')
        log_flag = False

        if -1 == log_header_pos and -1 == bb_header_pos and -1 == cc_header_pos and -1 == dd_header_pos:
            break

        min_value = find_min([log_header_pos, bb_header_pos, cc_header_pos, dd_header_pos])

        if min_value == log_header_pos:
            log_flag = True

        log_header_len_str = log_handle_str[min_value + 6:log_header_pos + 10]
        print('log_header_len_str: {}'.format(log_header_len_str))
        le_log_header_len_str = log_header_len_str[2:] + log_header_len_str[:2]
        print('le_log_header_len_str: {}'.format(le_log_header_len_str))
        log_header_len = int(le_log_header_len_str, 16)
        # log_header_len = int(log_header_len_str, 16)
        print('log_header_len: {}'.format(log_header_len))
        if log_flag:
            log_str += log_handle_str[min_value + 10:min_value + 10 + log_header_len * 2]

        log_handle_str = log_handle_str[min_value + 10 + log_header_len * 2:]
        print(log_handle_str)

    if log_str:
        print(log_str)
        # print(binascii.a2b_hex(log_str).decode('unicode-escape', 'ignore'))
        print(binascii.a2b_hex(log_str).decode('utf-8', 'ignore'))

if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)
    print('Script start execution at {}\n'.format(str(datetime.datetime.now())))

    time_start = time.time()

    main()
    # for _ in range(10):
    #     find_min([random.randint(1, 50), random.randint(1, 50), random.randint(1, 50)])

    print('\nTotal elapsed time: {} seconds'.format(time.time() - time_start))
    print('Script end execution at {}'.format(datetime.datetime.now()))
