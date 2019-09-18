# -*- coding:utf-8 -*-

"""
@Author:        hogan.chen@ymail.com
@Create Date:   2019-06-18
@Update Date:   2019-06-18
@Version:       V0.9.20190618
"""

import os
import re
import time
import json
import socket
import serial
import logging
import binascii
import datetime
import threading
import socketserver

import socket_config

THREADING_LOCK = threading.Lock()


class SerialPortHandleClass:
    def __init__(self, port, baud_rate='115200', read_timeout=1, write_time=1):
        self.port = port
        self.baud_rate = baud_rate
        self.read_timeout = read_timeout
        self.write_timeout = write_time
        self.__read_size = 4000

        self.__serial_handle = None
        self.serial_rw_status_flag = False

        self.open_serial_port()

    def open_serial_port(self):
        try:
            self.__serial_handle = serial.Serial(self.port, self.baud_rate, timeout=self.read_timeout,
                                                 write_timeout=self.write_timeout)
        except (serial.SerialTimeoutException, serial.SerialException) as err:
            self.serial_rw_status_flag = False
            logging.critical('Can not open serial port {}, error message: {}'.format(self.port, err))
            raise IOError(err)
        else:
            self.serial_rw_status_flag = True

    def close_serial_port(self):
        if self.serial_rw_status_flag:
            self.__serial_handle.close()
            self.serial_rw_status_flag = False

    def send_cmd_to_serial(self, cmd_str):
        if self.serial_rw_status_flag:
            try:
                cmd_str = re.sub(r'\s+', '', cmd_str)

                # cmd_byte = binascii.a2b_hex(cmd_str)
                cmd_byte = cmd_str.encode('utf-8')

                self.__serial_handle.write(cmd_byte)
            except (serial.SerialTimeoutException, serial.SerialException):
                self.serial_rw_status_flag = False
            except Exception as err:
                logging.error('Unexpected error happened, error information: {}'.format(err))

    def reset_output_buffer(self):
        if self.serial_rw_status_flag:
            self.__serial_handle.reset_output_buffer()

    def get_data_from_serial(self, read_flag=1):
        serial_data = None

        if self.serial_rw_status_flag:
            try:
                if 0 == read_flag:
                    serial_data = self.__serial_handle.readline()
                elif 1 == read_flag:
                    serial_data = self.__serial_handle.readlines(self.__read_size)
                else:
                    logging.error('Unsupported read flag value {}'.format(read_flag))
            except serial.SerialException:
                self.serial_rw_status_flag = False

        return serial_data


class TestLogHandleClass:
    def __init__(self, file_name):
        self.__file_name = os.path.join(socket_config.TEST_LOG_DIR, file_name)

        self.__fd = None
        self.__file_open_flag = False
        self.__file_end_flag = False

        self.open_log_file()

    @staticmethod
    def create_log_folder():
        log_path = socket_config.TEST_LOG_DIR

        if os.path.exists(log_path):
            if not os.path.isdir(log_path):
                try:
                    os.remove(log_path)
                    os.makedirs(log_path)
                finally:
                    pass
        else:
            try:
                os.makedirs(log_path)
            finally:
                pass

    def open_log_file(self):
        self. create_log_folder()

        try:
            self.__fd = open(self.__file_name, 'a', encoding='utf-8')
            self.__fd.seek(0, 0)
            self.__file_open_flag = True
        except Exception as err:
            self.__file_open_flag = False
            logging.critical('Can not open {} file, error message: {}'.format(self.__file_name, err))
            raise IOError(err)

    def close_log_file(self):
        if self.__file_open_flag:
            self.__fd.close()
            self.__file_open_flag = False
            self.__file_end_flag = False

    def write_log_to_file(self, source, msg):
        datetime_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
        write_msg = '{} -> [{}]:\n{}'.format(datetime_str, source, msg)
        # debug_print(write_msg)

        if self.__file_open_flag:
            try:
                self.__fd.write('{}\n'.format(write_msg))
                self.__fd.flush()
            except Exception as err:
                logging.error('Write log file {} error, error message: {}'.format(self.__file_name, err))
                self.close_log_file()


def debug_print(msg):
    datetime_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
    print_msg = 'Debug information: {} -> {}'.format(datetime_str, msg)

    THREADING_LOCK.acquire()
    print(print_msg)
    THREADING_LOCK.release()


def create_console_output_file(file_name):
    try:
        log_fd = open(file_name, 'w', encoding='utf-8')
    except Exception as err:
        logging.critical('Can not open {} file, error message: {}'.format(file_name, err))
        raise IOError(err)

    return log_fd


def write_console_output_file(log_fd, source, console_msg):
    datetime_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
    write_msg = '{} -> [{}]{}'.format(datetime_str, source, console_msg)
    logging.debug(write_msg)

    THREADING_LOCK.acquire()

    if log_fd:
        try:
            log_fd.write('{}\n'.format(write_msg))
            log_fd.flush()
        except Exception as err:
            logging.error('Write log file error(log_fd: {}), error message: {}'.format(log_fd, err))
            close_console_output_file(log_fd)

    THREADING_LOCK.release()


def close_console_output_file(log_fd):
    if log_fd:
        log_fd.close()


class TestLogHandler(threading.Thread):
    phone_status_list = []

    client_status_thread_lock = threading.Lock()

    def __init__(self, client_socket, client_address, log_fd):
        super().__init__()
        self.client_socket = client_socket
        self.client_address = client_address
        self.log_fd = log_fd

        self.phone_info = None
        self.dev_port = None

        self.log_handle_inst = None
        self.serial_handle_inst = None

        self.case_flag = False
        self.finished_flag = False
        self.abnormal_flag = False

        self.ack_data = {'type': 'info', 'category': 'ack', 'message': 'ack message'}

    def send_msg_to_client(self, send_msg):
        write_console_output_file(self.log_fd, 'INFO', 'Start to send phone message[{}, {}]: message: "{}"'.
                                  format(self.name, self.client_address, send_msg))

        if not self.abnormal_flag:
            if send_msg:
                try:
                    self.client_socket.sendall(send_msg.encode(encoding='utf-8'))
                except Exception as err:
                    write_console_output_file(self.log_fd, 'WARNING',
                                              'Send phone message error[{}, {}]: error message: "{}"'.
                                              format(self.name, self.client_address, err))
                    self.abnormal_flag = True
            else:
                write_console_output_file(self.log_fd, 'WARNING',
                                          'Incorrect phone message format[{}, {}]: len(send_msg) = {}'.
                                          format(self.name, self.client_address, len(send_msg)))
        else:
            write_console_output_file(self.log_fd, 'WARNING', 'Network Abnormal[{}, {}]: self.abnormal_flag: {}'.
                                      format(self.name, self.client_address, self.abnormal_flag))

    def receive_msg_from_client(self):
        msg_str = None
        write_console_output_file(self.log_fd, 'INFO', 'Start to receive phone message[{}, {}]...'.
                                  format(self.name, self.client_address))

        if not self.abnormal_flag:
            try:
                req_msg = self.client_socket.recv(socket_config.SOCKET_RECEIVE_BUFFER).decode(encoding='utf-8')
            except Exception as err:
                write_console_output_file(self.log_fd, 'WARNING', 'Exception error[{}, {}]: "{}"'.
                                          format(self.name, self.client_address, err))
                self.abnormal_flag = True
            else:
                if req_msg:
                    write_console_output_file(self.log_fd, 'INFO', 'Receive phone message[{}, {}]: {}'.
                                              format(self.name, self.client_address, req_msg))

                    msg_str = req_msg
                else:
                    write_console_output_file(self.log_fd, 'WARNING',
                                              'Network abnormal[{}, {}]: Remote client shutdown socket connection, '
                                              'len(req_msg) = {}'.format(self.name, self.client_address, len(req_msg)))
                    self.abnormal_flag = True

        return msg_str

    def send_command_to_client(self, cmd_str):
        cmd_data = {'type': 'cmd', 'category': 'phone', 'message': cmd_str}

        self.send_msg_to_client(cmd_data)

    def log_msg_handle(self, msg_str):
        if self.log_handle_inst is not None:
            self.log_handle_inst.write_log_to_file(self.client_address, msg_str)

    def end_handle(self):
        if self.log_handle_inst is not None:
            self.log_handle_inst.close_log_file()
            self.log_handle_inst = None

        if self.serial_handle_inst is not None:
            self.serial_handle_inst.close_serial_port()

        for phone_status_dict in TestLogHandler.phone_status_list:
            if self.client_address[0] == phone_status_dict['ip']:
                phone_status_dict['tested'] = True

    def request_handle(self):
        for phone_status_dict in TestLogHandler.phone_status_list:
            if self.client_address[0] == phone_status_dict['ip']:
                if self.client_address[1] != phone_status_dict['port']:
                    phone_status_dict['port'] = self.client_address[1]
                break
        else:
            TestLogHandler.client_status_thread_lock.acquire()
            TestLogHandler.phone_status_list.append({'ip': self.client_address[0],
                                                     'port': self.client_address[1],
                                                     'tested': False,
                                                     })
            TestLogHandler.client_status_thread_lock.release()

        if self.log_handle_inst is None:
            if not socket_config.DEBUG_MODE_FLAG:
                self.log_handle_inst = TestLogHandleClass('{}{}'.format(
                    self.client_address[0].replace('.', '_'), socket_config.TEST_LOG_SUFFIX))
            else:
                self.log_handle_inst = TestLogHandleClass('{}{}'.format(
                    '{}_{}'.format(self.client_address[0].replace('.', '_'), self.client_address[1]),
                    socket_config.TEST_LOG_SUFFIX))

        while True:
            log_str = self.receive_msg_from_client()

            if log_str is not None:
                self.log_msg_handle(log_str)

            if not self.abnormal_flag:
                write_console_output_file(self.log_fd, 'INFO', '[{}]: AppTestHandler.phone_status_list: {}'.
                                          format(self.name, TestLogHandler.phone_status_list))
            else:
                write_console_output_file(self.log_fd, 'WARNING',
                                          'Socket connection error[{}, {}]: self.abnormal_flag: "{}"'.
                                          format(self.name, self.client_address, self.abnormal_flag))

                for entry_index in range(len(TestLogHandler.phone_status_list)):
                    if self.client_address[0] == TestLogHandler.phone_status_list[entry_index].get('ip'):
                        TestLogHandler.client_status_thread_lock.acquire()
                        TestLogHandler.phone_status_list.pop(entry_index)
                        TestLogHandler.client_status_thread_lock.release()
                        break

                # close the socket connection, and end the socket connection threading
                self.client_socket.close()
                break

    def run(self):
        self.request_handle()


def start_log_server():
    logging.info('start the log server to save the test log...')

    client_thread_lists = []

    server_address = (socket_config.SOCKET_SERVER_ADDRESS, socket_config.SOCKET_SERVER_PORT)

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as socket_server:
        # Running an example several times with too small delay between executions, could lead to this error:
        # OSError: [Errno 98] Address already in use
        # This is because the previous execution has left the socket in a TIME_WAIT state,
        # and can’t be immediately reused.
        # There is a socket flag to set, in order to prevent this, socket.SO_REUSEADDR:
        '''
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind((HOST, PORT))
        '''
        # the SO_REUSEADDR flag tells the kernel to reuse a local socket in TIME_WAIT state,
        # without waiting for its natural timeout to expire.
        socket_server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

        # Bind the socket to address. The socket must not already be bound.
        socket_server.bind(server_address)

        # Set a timeout on blocking socket operations
        socket_server.settimeout(socket_config.SOCKET_TIMEOUT)

        # Enable a server to accept connections. If backlog is specified,
        # it must be at least 0 (if it is lower, it is set to 0);
        # it specifies the number of unaccepted connections that the system will allow before refusing new connections.
        # If not specified, a default reasonable value is chosen.
        socket_server.listen(socket_config.SOCKET_MAX_CLIENT_NUM)

        file_name = '{}{}'.format(os.path.join(socket_config.TEST_CONSOLE_OUTPUT_DIR,
                                               socket_config.TEST_CONSOLE_OUTPUT_FILE_NAME),
                                  socket_config.TEST_LOG_SUFFIX)
        log_fd = create_console_output_file(file_name)

        # logging.info('Start the socket server...')
        write_console_output_file(log_fd, 'INFO', 'Start the socket server...')
        start_time = datetime.datetime.now()

        while True:
            try:
                client_socket, client_address = socket_server.accept()
                client_socket.settimeout(socket_config.SOCKET_TIMEOUT)
            except Exception as err:
                logging.debug('Connect Accept Error: "{}"'.format(err))
            else:
                write_console_output_file(log_fd, 'INFO',
                                          '#################### New connect from {} ####################'.
                                          format(client_address))
                logging.info('#################### New connect from {} ####################'.format(client_address))

                client_thread = TestLogHandler(client_socket, client_address, log_fd)
                client_thread_lists.append(client_thread)
                client_thread.daemon = True
                # time.sleep(2)
                client_thread.start()
                # time.sleep(2)
            finally:
                # check the test is finished or not
                end_time = datetime.datetime.now()

                if (end_time - start_time).seconds > socket_config.TEST_LOG_MAX_TIME_INTERVAL * 60:
                    logging.info('The time interval has exceed the {}(minutes) max time interval...'.
                                 format(socket_config.TEST_LOG_MAX_TIME_INTERVAL))

                    # shutdown the socket connection
                    for socket_client_thread in client_thread_lists:
                        write_console_output_file(log_fd, 'INFO', 'Shutdown the socket client connection with "{}"...'.
                                                  format(socket_client_thread.client_address))
                        logging.info('Shutdown the socket client connection with "{}"...'.
                                     format(socket_client_thread.client_address))

                        socket_client_thread.abnormal_flag = True
                        socket_client_thread.join()

                    # clean the class parameter
                    TestLogHandler.phone_status_list = []
                    break

        # logging.info('Shutdown the socket server...')
        write_console_output_file(log_fd, 'INFO', 'Shutdown the socket server...')
        logging.info('Shutdown the socket server...')

        # socket_server.shutdown(socket.SHUT_RDWR)
        socket_server.close()


class ThreadedTCPRequestHandler(socketserver.BaseRequestHandler):
    running_flag = False
    phone_list = []
    tested_phone_list = []

    def start_running(self):
        pass

    def log_handle(self, msg_dict):
        pass

    def cmd_handle(self, msg_dict):
        pass

    def heartbeat_handle(self, msg_dict):
        # cur_thread = threading.current_thread()
        logging.info("Received heartbeat packet from %s, the message content is: %s", self.client_address, msg_dict)

        if self.client_address not in ThreadedTCPRequestHandler.phone_list:
            ThreadedTCPRequestHandler.phone_list.append(self.client_address)

        if self.client_address not in ThreadedTCPRequestHandler.tested_phone_list:
            if not ThreadedTCPRequestHandler.running_flag:
                self.start_running()

    def handle(self):
        """
        data = str(self.request.recv(1024), 'ascii')
        cur_thread = threading.current_thread()
        response = bytes("{}: {}".format(cur_thread.name, data), 'ascii')
        self.request.sendall(response)
        :return:
        """
        req_str = self.request.recv(socket_config.SOCKET_RECEIVE_BUFFER).decode(encoding='utf-8')

        try:
            json_str = json.loads(req_str)
        except BaseException as Err:
            logging.error(Err)
        else:
            msg_type = json_str['type']
            # msg_content = json_str['message']

            if 'cmd' == msg_type:
                self.cmd_handle(json_str)
            elif 'log' == msg_type:
                self.log_handle(json_str)
            elif 'heart' == msg_type:
                self.heartbeat_handle(json_str)
            else:
                pass

    def finish(self):
        logging.debug("End socket connect with client ip: %s" % str(self.client_address))
        pass

    def setup(self):
        logging.debug("Start socket connect with client ip: %s" % str(self.client_address))
        pass


class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    """
    This is because the previous execution has left the socket in a TIME_WAIT state, and can’t be immediately reused.
    There is a socket flag to set, in order to prevent this, socket.SO_REUSEADDR:
    """
    socketserver.TCPServer.allow_reuse_address = True
    pass


class OpenSocketServer:
    def __init__(self, server_ip, server_port=20000):
        self.server_ip = server_ip
        self.server_port = server_port
        self.server_handle = None

    def open_socket_server(self, server_ip, server_port=20000):
        self.server_ip = server_ip
        self.server_port = server_port
        self.server_handle = ThreadedTCPServer((server_ip, server_port), ThreadedTCPRequestHandler)

        with self.server_handle:
            # Start a thread with the server -- that thread will then start one
            # more thread for each request
            server_thread = threading.Thread(target=self.server_handle.serve_forever)
            # Exit the server thread when the main thread terminates
            server_thread.daemon = True
            server_thread.start()
            logging.debug("Server loop running in thread:", server_thread.name)

    def close_socket_server(self):
        self.server_handle.server_close()
        self.server_handle.shutdown()


def client(ip, port, message):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock_client:
        # sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock_client.connect((ip, port))
        sock_client.sendall(bytes(message, 'ascii'))
        response = str(sock_client.recv(1024), 'ascii')
        logging.debug("Received: {}".format(response))
        logging.debug(socket.gethostbyname(socket.gethostname()),
                      socket.gethostbyaddr(socket.gethostname()), socket.gethostname())
        # sock.close()


def socket_connect_test():
    # Port 0 means to select an arbitrary unused port
    # host, port = "localhost", 0
    host, port = "172.16.49.142", 20000

    server = ThreadedTCPServer((host, port), ThreadedTCPRequestHandler)
    with server:
        ip, port = server.server_address

        logging.debug(ip, port)

        # Start a thread with the server -- that thread will then start one
        # more thread for each request
        server_thread = threading.Thread(target=server.serve_forever)
        # Exit the server thread when the main thread terminates
        server_thread.daemon = True
        server_thread.start()
        logging.debug("Server loop running in thread:", server_thread.name)

        client(ip, port, "Hello World 1")
        time.sleep(10)
        client(ip, port, "Hello World 2")
        time.sleep(10)
        client(ip, port, "Hello World 3")
        time.sleep(10)

        server.server_close()
        server.shutdown()


def main():
    socket_config.logging_config(socket_config.LOGGING_LEVEL)

    start_log_server()


if __name__ == "__main__":
    print("Script start execution at {}".format(str(datetime.datetime.now())))

    time_start = time.time()
    main()

    print("\n\nTotal Elapsed Time: {} seconds".format(time.time() - time_start))
    print("\nScript end execution at {}".format(datetime.datetime.now()))
