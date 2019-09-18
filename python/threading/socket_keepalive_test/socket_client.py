# -*- coding:utf-8 -*-

"""
@Author:        hogan.chen@ymail.com
@Create Date:   2019-06-18
@Update Date:   2019-06-18
@Version:       V0.9.20190618
"""

import time
import json
import string
import socket
import random
import inspect
import logging
import datetime
import threading

MAX_THREAD_NUM = 10
SERVER_IP_ADDR = '127.0.0.1'
SERVER_IP_PORT = 8000
LUCK_NUM = 1000
PRINT_THREADING_LOCK = threading.Lock()

PHONE_SYSTEM_INFO_LIST = [
    {'manufacturer': 'XiaoMi', 'model': 'XiaoMi 1', 'version': '1.1.1', 'imei': '123456789000001'},
    {'manufacturer': 'XiaoMi', 'model': 'XiaoMi 2', 'version': '2.1.1', 'imei': '123456789000002'},
    {'manufacturer': 'XiaoMi', 'model': 'XiaoMi 3', 'version': '3.1.1', 'imei': '123456789000003'},
    {'manufacturer': 'XiaoMi', 'model': 'XiaoMi 4', 'version': '4.1.1', 'imei': '123456789000004'},
    {'manufacturer': 'XiaoMi', 'model': 'XiaoMi 5', 'version': '5.1.1', 'imei': '123456789000005'},
    {'manufacturer': 'XiaoMi', 'model': 'XiaoMi 6', 'version': '6.1.1', 'imei': '123456789000006'},
    {'manufacturer': 'XiaoMi', 'model': 'XiaoMi 7', 'version': '7.1.1', 'imei': '123456789000007'},
    {'manufacturer': 'XiaoMi', 'model': 'XiaoMi 8', 'version': '8.1.1', 'imei': '123456789000008'},

    {'manufacturer': 'Honor', 'model': 'Honor-1', 'version': '1.1.1', 'imei': '123456789000011'},
    {'manufacturer': 'Honor', 'model': 'Honor-2', 'version': '2.1.1', 'imei': '123456789000012'},
    {'manufacturer': 'Honor', 'model': 'Honor-3', 'version': '3.1.1', 'imei': '123456789000013'},
    {'manufacturer': 'Honor', 'model': 'Honor-4', 'version': '4.1.1', 'imei': '123456789000014'},
    {'manufacturer': 'Honor', 'model': 'Honor-5', 'version': '5.1.1', 'imei': '123456789000015'},
    {'manufacturer': 'Honor', 'model': 'Honor-6', 'version': '6.1.1', 'imei': '123456789000016'},
    {'manufacturer': 'Honor', 'model': 'Honor-7', 'version': '7.1.1', 'imei': '123456789000017'},
    {'manufacturer': 'Honor', 'model': 'Honor-8', 'version': '8.1.1', 'imei': '123456789000018'},

    {'manufacturer': 'Vivo', 'model': 'Vivo X11', 'version': '1.1.1', 'imei': '123456789000021'},
    {'manufacturer': 'Vivo', 'model': 'Vivo X12', 'version': '2.1.1', 'imei': '123456789000022'},
    {'manufacturer': 'Vivo', 'model': 'Vivo X13', 'version': '3.1.1', 'imei': '123456789000023'},
    {'manufacturer': 'Vivo', 'model': 'Vivo X14', 'version': '4.1.1', 'imei': '123456789000024'},
    {'manufacturer': 'Vivo', 'model': 'Vivo X15', 'version': '5.1.1', 'imei': '123456789000025'},
    {'manufacturer': 'Vivo', 'model': 'Vivo X16', 'version': '6.1.1', 'imei': '123456789000026'},
    {'manufacturer': 'Vivo', 'model': 'Vivo X17', 'version': '7.1.1', 'imei': '123456789000027'},
    {'manufacturer': 'Vivo', 'model': 'Vivo X18', 'version': '8.1.1', 'imei': '123456789000028'},

    {'manufacturer': 'Oppo', 'model': 'Oppo F11', 'version': '1.1.1', 'imei': '123456789000031'},
    {'manufacturer': 'Oppo', 'model': 'Oppo F12', 'version': '2.1.1', 'imei': '123456789000032'},
    {'manufacturer': 'Oppo', 'model': 'Oppo F13', 'version': '3.1.1', 'imei': '123456789000033'},
    {'manufacturer': 'Oppo', 'model': 'Oppo F14', 'version': '4.1.1', 'imei': '123456789000034'},
    {'manufacturer': 'Oppo', 'model': 'Oppo F15', 'version': '5.1.1', 'imei': '123456789000035'},
    {'manufacturer': 'Oppo', 'model': 'Oppo F16', 'version': '6.1.1', 'imei': '123456789000036'},
    {'manufacturer': 'Oppo', 'model': 'Oppo F17', 'version': '7.1.1', 'imei': '123456789000037'},
    {'manufacturer': 'Oppo', 'model': 'Oppo F18', 'version': '8.1.1', 'imei': '123456789000038'},
]

LOG_MESSAGE = '{}: Log message {}'
RESULT_MESSAGE = [
    '{}: TEST RESULT: PASS',
    '{}: TEST RESULT: FAIL',
    '{}: TEST RESULT: ERROR',
    '{}: TEST RESULT: SKIP',
]

frame = inspect.currentframe()

# log level
LOGGING_LEVEL = logging.DEBUG


def logging_config(logging_level):
    # log_format = '%(asctime)s - %(levelname)s - %(message)s'
    # log_format = '%(asctime)s [line: %(lineno)d] - %(levelname)s - %(message)s'
    log_format = '[%(asctime)s - [File: %(filename)s line: %(lineno)d] - %(levelname)s]: %(message)s'
    logging.basicConfig(level=logging_level, format=log_format)


def connect(ip, port):
    while True:
        try:
            socket_handle = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            socket_handle.connect((ip, port))
        except Exception as err:
            print('Error message: {}'.format(err))
            time.sleep(5)
        else:
            break

    return socket_handle


def client_send(socket_handle, message):
    ret_value = True
    json_str = json.dumps(message)

    if socket_handle is not None:
        print('Send: {}'.format(json_str))
        try:
            socket_handle.sendall(json_str.encode(encoding='utf-8'))
            print('address: {}, hostname tripe: {}, hostname: {}'.format(socket.gethostbyname(socket.gethostname()),
                                                                         socket.gethostbyaddr(socket.gethostname()),
                                                                         socket.gethostname()))
        except Exception as err:
            print('Error message: {}'.format(err))
            ret_value = False

        # sock.close()

    return ret_value


def client_send_received(socket_handle, message):
    ret_value = True
    json_str = json.dumps(message)

    if socket_handle is not None:
        print('Send: {}'.format(json_str))
        try:
            socket_handle.sendall(json_str.encode(encoding='utf-8'))
            response = socket_handle.recv(1024).decode(encoding='utf-8')
            print('Received: {}'.format(response))
            print('address: {}, hostname tripe: {}, hostname: {}'.format(socket.gethostbyname(socket.gethostname()),
                                                                         socket.gethostbyaddr(socket.gethostname()),
                                                                         socket.gethostname()))
        except Exception as err:
            print('Error message: {}'.format(err))
            ret_value = False

        # sock.close()

    return ret_value


def client_received(socket_handle):
    response = None

    if socket_handle is not None:
        response = socket_handle.recv(1024).decode(encoding='utf-8')
        print('Received: {}'.format(response))
        print('address: {}, hostname tripe: {}, hostname: {}'.format(socket.gethostbyname(socket.gethostname()),
                                                                     socket.gethostbyaddr(socket.gethostname()),
                                                                     socket.gethostname()))

    return response


def run_socket_client():
    ip, port = '172.16.53.55', 5000
    sys_message = {'type': 'info', 'category': 'phone',
                   'message': {'manufacturer': 'XiaoMi', 'model': 'MI 6', 'version': '8.1.1',
                               'imei': '201808020957129'}}
    fpga_cmd_message = {'type': 'cmd', 'category': 'fpga', 'message': 'AA 00 00'}
    hb_message = {'type': 'info', 'category': 'heart', 'message': 'heart message'}
    log_message = {'type': 'log', 'category': 'log', 'message': ''}
    result_message = {'type': 'log', 'category': 'result', 'message': 'Test Result: PASSED'}

    socket_handle = connect(ip, port)
    test_count = 3

    client_send(socket_handle, sys_message)
    time.sleep(5)

    count = 5
    received_msg = None

    while True:
        send_ret = client_send(socket_handle, hb_message)
        if not send_ret:
            break

        received_json_msg = client_received(socket_handle)
        if received_json_msg is None or not received_json_msg:
            break
        else:
            received_msg = json.loads(received_json_msg)

        if 'cmd' == received_msg['type']:
            break
        else:
            time.sleep(5)

    while True:
        if 'cmd' == received_msg['type'] and 'EE 00 00 00' == received_msg['message']['command']:
            client_send(socket_handle, fpga_cmd_message)
            time.sleep(2)
            while count > 0:
                message_content = 'log message {}'.format(count)
                log_message['message'] = message_content
                client_send(socket_handle, log_message)
                time.sleep(5)
                count -= 1

            client_send(socket_handle, fpga_cmd_message)
            time.sleep(2)
            client_send(socket_handle, result_message)
            test_count -= 1

        if test_count <= 0:
            break
        else:
            count = 5

        time.sleep(5)
        # count -= 1

        received_json_msg = client_received(socket_handle)
        if received_json_msg is None or not received_json_msg:
            break
        else:
            received_msg = json.loads(received_json_msg)

    try:
        socket_handle.shutdown(socket.SHUT_RDWR)
        socket_handle.close()
    except Exception as err:
        print('Error message: {}'.format(err))


def debug_print(msg):
    datetime_str = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')
    print_msg = 'Debug Information: {} -> {}'.format(datetime_str, msg)

    PRINT_THREADING_LOCK.acquire()
    print(print_msg)
    PRINT_THREADING_LOCK.release()


class SocketClientHandler(threading.Thread):
    def __init__(self, thread_index, server_ip, server_port):
        super().__init__()
        self.thread_index = thread_index
        self.server_ip = server_ip
        self.server_port = server_port

        self.connect_flag = False
        self.socket_handle = None

    def socket_connect_to_server(self):
        time.sleep(random.randint(1, 10))
        logging.info('Start to connect the socket server...')

        while True:
            try:
                self.socket_handle = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                # self.socket_handle.setblocking(False)
                self.socket_handle.settimeout(5)

                self.socket_handle.connect((self.server_ip, self.server_port))
            except Exception as err:
                logging.warning('Connect Failed[{}, {}]: "{}"'.format(self.thread_index, self.name, err))
                time.sleep(random.randint(1, 5))
            else:
                logging.debug('Address: "{}", Hostname tripe: "{}", Hostname: "{}"'.
                              format(socket.gethostbyname(socket.gethostname()),
                                     socket.gethostbyaddr(socket.gethostname()),
                                     socket.gethostname()))

                self.connect_flag = True
                break

    def send_json_message_to_server(self, message):
        # json_str = json.dumps(message)
        json_str = message

        if self.connect_flag:
            logging.info('Send Message[{}, {}]: "{}"'.format(self.thread_index, self.name, json_str))

            try:
                self.socket_handle.sendall(json_str.encode(encoding='utf-8'))
            except Exception as err:
                logging.warning('Send Failed[{}, {}]: "{}"'.format(self.thread_index, self.name, err))
                self.connect_flag = False
        else:
            logging.warning('Connection Error[{}, {}]: status: "{}"'.format(self.thread_index, self.name,
                                                                            self.connect_flag))

    def send_message_to_server(self, msg_type, msg_category, msg_str):
        cmd_message = {'type': msg_type, 'category': msg_category, 'message': msg_str}
        self.send_json_message_to_server(cmd_message)

    def received_message_from_server(self):
        json_str = None

        if self.connect_flag:
            try:
                response = self.socket_handle.recv(1024).decode(encoding='utf-8')
            except socket.timeout as err:
                logging.debug('Received Error[{}, {}]: "{}"'.format(self.thread_index, self.name, err))
            except socket.error as err:
                logging.debug('Received Error[{}, {}]: "{}"'.format(self.thread_index, self.name, err))
                self.connect_flag = False
            else:
                if response:
                    logging.info('Received Message[{}, {}]: "{}"'.format(self.thread_index, self.name, response))

                    try:
                        json_str = json.loads(response)
                    except BaseException as err:
                        logging.warning('JSON Load Error[{}, {}]: "{}"'.format(self.thread_index, self.name, err))
        else:
            logging.warning('Connection Error[{}, {}]: status: "{}"'.format(self.thread_index, self.name,
                                                                            self.connect_flag))
        return json_str

    def received_handle(self):
        log_message_count = random.randint(50, 100)
        log_message_index = 0
        start_test_flag = False

        while True:
            if not self.connect_flag:
                break

            if not start_test_flag:
                # send heart message
                # time.sleep(5)
                self.send_message_to_server('info', 'heart', 'heart message')

            json_str = self.received_message_from_server()

            if json_str is not None:
                msg_type = json_str['type']

                if 'cmd' == msg_type:
                    start_test_flag = True
                elif 'info' == msg_type:
                    logging.info('Received Info Message[{}, {}]: "{}"'.
                                 format(self.thread_index, self.name, json_str))
                else:
                    logging.info('Received Incorrect Message[{}, {}]: "{}"'.
                                 format(self.thread_index, self.name, json_str))

                # random to end the connection
                if LUCK_NUM == random.randint(0, 10):
                    logging.critical('Disconnect with the server[{}, {}]'.format(self.thread_index, self.name))
                    self.socket_handle.close()
                    self.socket_handle = None
                    self.connect_flag = False
                    # break

                # start to send log message
                if start_test_flag:
                    if log_message_index < log_message_count:
                        self.send_message_to_server('log', 'log', LOG_MESSAGE.
                                                    format('[{}, {}]'.format(self.thread_index, self.name),
                                                           log_message_index))
                        log_message_index += 1
                        time.sleep(0.5)
                    else:
                        self.send_message_to_server('log', 'result', random.choice(RESULT_MESSAGE))
                        break
            else:
                pass
                # break

    def run(self):
        while True:
            if not self.connect_flag:
                self.socket_connect_to_server()
            else:
                self.send_json_message_to_server(''.join(random.choices(string.ascii_letters + string.digits, k=100)))
                time.sleep(random.randint(1, 5))


def run_threading_socket_client():
    socket_thread_list = []

    for thread_index in range(MAX_THREAD_NUM):
        thread_handler = SocketClientHandler(thread_index, SERVER_IP_ADDR, SERVER_IP_PORT)
        socket_thread_list.append(thread_handler)

    for thread_index in range(MAX_THREAD_NUM):
        socket_thread_list[thread_index].start()

    for thread_index in range(MAX_THREAD_NUM):
        socket_thread_list[thread_index].join()


def run_socket_client_multi_times(times=10):
    run_time = times
    while run_time > 0:
        run_socket_client()
        run_time -= 1


def main():
    # run_socket_client_multi_times()

    run_threading_socket_client()


if __name__ == '__main__':
    print('Script start execution at {}'.format(str(datetime.datetime.now())))

    logging_config(LOGGING_LEVEL)

    time_start = time.time()
    main()

    print('\n\nTotal Elapsed Time: {} seconds'.format(time.time() - time_start))
    print('\nScript end execution at {}'.format(datetime.datetime.now()))
