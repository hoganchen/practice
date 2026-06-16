/*
 * 知识点：TCP 服务器编程 (TCP Server Socket)
 *
 * 编译指令（Windows）：
 *   gcc 02_tcp_server.c -o 02_tcp_server.exe -std=c11 -Wall -lws2_32
 *
 * 编译指令（Linux/Mac）：
 *   gcc 02_tcp_server.c -o 02_tcp_server -std=c11 -Wall
 *
 * 运行指令：./02_tcp_server.exe
 *
 * 本文件演示 TCP 服务器套接字编程：
 *   - socket()    —— 创建套接字
 *   - bind()      —— 绑定地址和端口
 *   - listen()    —— 监听连接请求
 *   - accept()    —— 接受客户端连接
 *   - send()      —— 发送数据给客户端
 *   - recv()      —— 接收客户端数据
 *
 * 程序功能：创建一个简单的 TCP 回显 (Echo) 服务器，
 * 监听 8888 端口，接收客户端消息并原样返回。
 * 可以用 telnet 或之前编写的 TCP 客户端连接测试。
 *
 * 注意：
 *   - 服务器必须绑定端口后才可监听
 *   - listen 的第二个参数是等待队列的最大长度
 *   - accept 是一个阻塞调用
 *   - 本示例为简单起见，一次只处理一个客户端
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ===== 平台相关的网络头文件 ===== */
#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
/* 编译时需添加 -lws2_32 链接 Winsock 库 */
#else
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#define SOCKET_ERROR -1
#define INVALID_SOCKET -1
typedef int SOCKET;
#endif

/* ===== 常量定义 ===== */
#define SERVER_PORT 8888       /* 服务器监听端口 */
#define MAX_CONNECTIONS 5      /* 最大等待连接数 */
#define BUFFER_SIZE 1024       /* 接收缓冲区大小 */

/* ===== 平台无关的函数封装 ===== */

void close_socket(SOCKET sock) {
#ifdef _WIN32
    closesocket(sock);
#else
    close(sock);
#endif
}

void print_socket_error(const char *message) {
#ifdef _WIN32
    fprintf(stderr, "%s, 错误码: %d\n", message, WSAGetLastError());
#else
    perror(message);
#endif
}

/* ===== 服务器逻辑 ===== */

/**
 * 处理客户端请求：接收消息并原样返回（回显服务器）
 * client_sock: 客户端的套接字
 * client_addr: 客户端地址信息
 */
void handle_client(SOCKET client_sock, struct sockaddr_in client_addr) {
    /* 将客户端 IP 转为可读字符串 */
    char client_ip[INET_ADDRSTRLEN];
    inet_ntop(AF_INET, &client_addr.sin_addr, client_ip, sizeof(client_ip));
    int client_port = ntohs(client_addr.sin_port);

    printf("  新客户端连接: %s:%d\n", client_ip, client_port);

    char buffer[BUFFER_SIZE];
    int bytes_received;

    /* 循环接收客户端数据，直到对方关闭连接 */
    while (1) {
        /*
         * recv: 接收数据
         * 返回 0 表示对方关闭连接
         * 返回负数表示出错
         */
        bytes_received = recv(client_sock, buffer, BUFFER_SIZE - 1, 0);
        if (bytes_received > 0) {
            buffer[bytes_received] = '\0';  /* 字符串结束 */

            printf("  收到来自 %s:%d 的消息 (%d 字节): %s",
                   client_ip, client_port, bytes_received, buffer);

            /*
             * 回显 (Echo)：将收到的数据原样发回客户端
             * send(套接字, 数据, 长度, 标志)
             */
            int bytes_sent = send(client_sock, buffer, bytes_received, 0);
            if (bytes_sent == SOCKET_ERROR) {
                print_socket_error("发送数据失败");
                break;
            }

            /* 检查是否收到退出命令 */
            if (strncmp(buffer, "quit", 4) == 0 ||
                strncmp(buffer, "exit", 4) == 0) {
                printf("  客户端请求断开连接。\n");
                break;
            }
        } else if (bytes_received == 0) {
            /* 客户端关闭连接 */
            printf("  客户端 %s:%d 断开连接。\n", client_ip, client_port);
            break;
        } else {
            print_socket_error("接收数据失败");
            break;
        }
    }

    /* 关闭客户端套接字 */
    close_socket(client_sock);
    printf("  客户端连接已释放。\n");
}

int main() {
    printf("============================================\n");
    printf("  TCP 服务器套接字演示\n");
    printf("============================================\n\n");

    SOCKET server_sock = INVALID_SOCKET;
    int ret;

    /* ===== 1. 初始化 Winsock (Windows) ===== */
#ifdef _WIN32
    printf("----- 1. 初始化 Winsock -----\n");

    WSADATA wsaData;
    ret = WSAStartup(MAKEWORD(2, 2), &wsaData);
    if (ret != 0) {
        fprintf(stderr, "WSAStartup 失败\n");
        return 1;
    }
    printf("Winsock 初始化成功。\n\n");
#endif

    /* ===== 2. 创建服务器套接字 ===== */
    printf("----- 2. 创建服务器套接字 -----\n");

    /*
     * socket(AF_INET, SOCK_STREAM, 0)
     * 创建一个 IPv4 的 TCP 套接字
     */
    server_sock = socket(AF_INET, SOCK_STREAM, 0);
    if (server_sock == INVALID_SOCKET) {
        print_socket_error("创建套接字失败");
#ifdef _WIN32
        WSACleanup();
#endif
        return 1;
    }
    printf("服务器套接字创建成功。\n\n");

    /* ===== 3. 设置套接字选项 ===== */
    printf("----- 3. 设置套接字选项 -----\n");

    /*
     * setsockopt: 设置套接字选项
     * SO_REUSEADDR: 允许重用本地地址和端口
     *   防止程序关闭后立即重启时的 "Address already in use" 错误
     */
    int optval = 1;
    ret = setsockopt(server_sock, SOL_SOCKET, SO_REUSEADDR,
                     (const char *)&optval, sizeof(optval));
    if (ret == SOCKET_ERROR) {
        print_socket_error("设置套接字选项失败");
    } else {
        printf("SO_REUSEADDR 设置成功。\n");
    }
    printf("\n");

    /* ===== 4. 绑定地址和端口 ===== */
    printf("----- 4. 绑定地址和端口 -----\n");

    /*
     * bind(套接字, 地址结构体, 地址结构体大小)
     * 将套接字与本地地址和端口关联
     *
     * INADDR_ANY: 绑定到本机的所有网络接口（0.0.0.0）
     *   这样无论是 localhost 还是局域网 IP 都可以访问
     */
    struct sockaddr_in server_addr;
    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = htonl(INADDR_ANY);  /* 绑定所有接口 */
    server_addr.sin_port = htons((unsigned short)SERVER_PORT);

    ret = bind(server_sock, (struct sockaddr *)&server_addr,
               sizeof(server_addr));
    if (ret == SOCKET_ERROR) {
        print_socket_error("绑定端口失败");
        close_socket(server_sock);
#ifdef _WIN32
        WSACleanup();
#endif
        return 1;
    }

    printf("成功绑定端口 %d\n", SERVER_PORT);
    printf("服务器将在以下地址监听:\n");
    printf("  http://localhost:%d/\n", SERVER_PORT);
    printf("  http://127.0.0.1:%d/\n", SERVER_PORT);
    printf("\n");

    /* ===== 5. 开始监听 ===== */
    printf("----- 5. 开始监听 -----\n");

    /*
     * listen(套接字, 等待队列长度)
     * 将套接字置于监听模式，准备接受客户端连接
     * 第二个参数指定最大等待连接数
     */
    ret = listen(server_sock, MAX_CONNECTIONS);
    if (ret == SOCKET_ERROR) {
        print_socket_error("监听失败");
        close_socket(server_sock);
#ifdef _WIN32
        WSACleanup();
#endif
        return 1;
    }

    printf("正在监听端口 %d...（等待客户端连接）\n", SERVER_PORT);
    printf("提示：使用 telnet 127.0.0.1 %d 连接测试\n", SERVER_PORT);
    printf("按 Ctrl+C 停止服务器\n\n");

    /* ===== 6. 接受客户端连接 ===== */
    printf("----- 6. 等待客户端连接 -----\n");

    /*
     * 服务器主循环：持续接受新客户端连接
     * 每次 accpet 返回一个新的套接字用于与客户端通信
     * 原有的 server_sock 继续监听新连接
     */
    int client_count = 0;

    while (1) {
        struct sockaddr_in client_addr;
        socklen_t client_addr_len = sizeof(client_addr);

        /*
         * accept(监听套接字, 客户端地址结构体, 地址长度)
         * 这是一个阻塞调用：如果没有客户端连接，会一直等待
         * 返回一个新的 SOCKET 用于与客户端通信
         */
        printf("\n等待客户端连接...\n");
        SOCKET client_sock = accept(server_sock,
                                     (struct sockaddr *)&client_addr,
                                     &client_addr_len);
        if (client_sock == INVALID_SOCKET) {
            print_socket_error("接受连接失败");
            continue;  /* 继续等待下一个连接 */
        }

        client_count++;
        printf("--- 客户端 #%d 已连接 ---\n", client_count);

        /* 处理客户端请求（本版本处理完一个客户端才接受下一个）
         * 实际生产环境通常会为每个客户端创建新线程 */
        handle_client(client_sock, client_addr);
    }

    /* ===== 7. 清理资源 ===== */
    /* 注意：上面的循环是无限循环，以下代码在正常情况下不会执行到
     * 当收到 Ctrl+C 信号时才会退出循环 */

    close_socket(server_sock);
    printf("服务器套接字已关闭。\n");

#ifdef _WIN32
    WSACleanup();
    printf("Winsock 已清理。\n");
#endif

    printf("\n============================================\n");
    printf("  程序结束\n");
    printf("============================================\n");

    return 0;
}
