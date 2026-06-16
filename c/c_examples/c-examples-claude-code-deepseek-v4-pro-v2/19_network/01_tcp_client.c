/*
 * 知识点：TCP 客户端编程 (TCP Client Socket)
 *
 * 编译指令（Windows）：
 *   gcc 01_tcp_client.c -o 01_tcp_client.exe -std=c11 -Wall -lws2_32
 *
 * 编译指令（Linux/Mac）：
 *   gcc 01_tcp_client.c -o 01_tcp_client -std=c11 -Wall
 *
 * 运行指令：./01_tcp_client.exe
 *
 * 本文件演示 TCP 客户端套接字编程：
 *   - WSAStartup() / WSACleanup() —— Windows 套接字初始化/清理
 *   - socket()     —— 创建套接字
 *   - connect()    —— 连接到服务器
 *   - send()       —— 发送数据
 *   - recv()       —— 接收数据
 *   - htons()      —— 主机字节序转网络字节序（16位）
 *   - htonl()      —— 主机字节序转网络字节序（32位）
 *   - inet_pton()  —— 将 IP 地址字符串转换为网络格式
 *
 * 程序功能：连接到 httpbin.org 的 HTTP 端口，发送 HTTP GET 请求，
 * 接收并显示响应内容。
 *
 * 注意：
 *   - Windows 需要 WSAStartup 和 WSACleanup
 *   - Unix 系统使用不同的头文件 (<sys/socket.h>, <netinet/in.h>, <arpa/inet.h>)
 *   - 网络字节序是大端 (Big-Endian)，x86 是小端 (Little-Endian)
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ===== 平台相关的网络头文件 ===== */
#ifdef _WIN32
/* Windows: 使用 Winsock2 库 */
#include <winsock2.h>
#include <ws2tcpip.h>  /* 提供 inet_pton 等函数 */
/* 编译时需添加 -lws2_32 链接 Winsock 库 */
#else
/* Unix/Linux/Mac: 使用 POSIX 套接字 */
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <netdb.h>      /* 提供 gethostbyname 等函数 */
#include <unistd.h>     /* 提供 close */
#define SOCKET_ERROR -1
#define INVALID_SOCKET -1
typedef int SOCKET;     /* Windows 的 SOCKET 类型在 Unix 上是 int */
#endif

/* ===== 缓冲区大小 ===== */
#define BUFFER_SIZE 4096

/* ===== 平台无关的套接字关闭函数 ===== */

/**
 * 关闭套接字（平台无关封装）
 */
void close_socket(SOCKET sock) {
#ifdef _WIN32
    closesocket(sock);
#else
    close(sock);
#endif
}

/* ===== 错误处理 ===== */

/**
 * 打印套接字错误信息（平台无关封装）
 */
void print_socket_error(const char *message) {
#ifdef _WIN32
    fprintf(stderr, "%s, 错误码: %d\n", message, WSAGetLastError());
#else
    perror(message);
#endif
}

int main() {
    printf("============================================\n");
    printf("  TCP 客户端套接字演示\n");
    printf("============================================\n\n");

    SOCKET client_sock = INVALID_SOCKET;
    int ret;

    /* ===== 1. 初始化套接字库 (仅 Windows 需要) ===== */
#ifdef _WIN32
    printf("----- 1. 初始化 Winsock -----\n");

    WSADATA wsaData;
    /* WSAStartup 请求 2.2 版本的 Winsock
     * MAKEWORD(2,2) 表示主版本号 2，次版本号 2 */
    ret = WSAStartup(MAKEWORD(2, 2), &wsaData);
    if (ret != 0) {
        fprintf(stderr, "WSAStartup 失败，错误码: %d\n", ret);
        return 1;
    }
    printf("Winsock 初始化成功。版本: %d.%d\n",
           LOBYTE(wsaData.wVersion), HIBYTE(wsaData.wVersion));
    printf("\n");
#endif

    /* ===== 2. 创建套接字 ===== */
    printf("----- 2. 创建套接字 -----\n");

    /*
     * socket(地址族, 套接字类型, 协议)
     * AF_INET:     IPv4 地址族
     * SOCK_STREAM: TCP 流式套接字
     * 0:           使用默认协议（TCP）
     *
     * 其他常见参数：
     * AF_INET6:    IPv6
     * SOCK_DGRAM:  UDP 数据报套接字
     * IPPROTO_TCP: 显式指定 TCP 协议
     */
    client_sock = socket(AF_INET, SOCK_STREAM, 0);
    if (client_sock == INVALID_SOCKET) {
        print_socket_error("创建套接字失败");
#ifdef _WIN32
        WSACleanup();
#endif
        return 1;
    }
    printf("套接字创建成功。\n\n");

    /* ===== 3. 配置服务器地址 ===== */
    printf("----- 3. 配置服务器地址 -----\n");

    /*
     * 目标服务器：httpbin.org
     * 端口：80 (HTTP)
     * 我们将发送一个 HTTP GET 请求
     */
    const char *host = "httpbin.org";
    int port = 80;

    /*
     * struct sockaddr_in 结构体：
     *   sin_family: 地址族 (AF_INET)
     *   sin_port:   端口号（网络字节序）
     *   sin_addr:   IP 地址（网络字节序）
     *
     * htons() = Host TO Network Short (16位)
     * htonl() = Host TO Network Long  (32位)
     * ntohs() / ntohl() 做反向转换
     */
    struct sockaddr_in server_addr;
    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    /* htons 将端口号从主机字节序转为网络字节序 */
    server_addr.sin_port = htons((unsigned short)port);

    /*
     * inet_pton(地址族, "点分十进制", &结构体中的地址字段)
     * 将 "93.184.216.34" 之类的字符串转换为网络字节序的二进制格式
     *
     * 也可以使用 gethostbyname() 通过域名获取 IP（更常用）
     */
    printf("正在解析主机名: %s...\n", host);

    /* 使用 gethostbyname 解析域名 */
#ifdef _WIN32
    /* Windows 上 gethostbyname 可能需要不同的设置 */
    struct hostent *remote_host = gethostbyname(host);
#else
    struct hostent *remote_host = gethostbyname(host);
#endif

    if (remote_host == NULL) {
        fprintf(stderr, "解析主机名失败: %s\n", host);
        print_socket_error("gethostbyname 错误");
        close_socket(client_sock);
#ifdef _WIN32
        WSACleanup();
#endif
        return 1;
    }

    /* 将解析到的 IP 地址复制到 sockaddr_in 结构中 */
    memcpy(&server_addr.sin_addr, remote_host->h_addr_list[0],
           (size_t)remote_host->h_length);

    /* 将 IP 地址转为可读字符串并显示 */
    char ip_str[INET_ADDRSTRLEN];
    inet_ntop(AF_INET, &server_addr.sin_addr, ip_str, sizeof(ip_str));
    printf("解析完成: %s -> %s:%d\n\n", host, ip_str, port);

    /* ===== 4. 连接服务器 ===== */
    printf("----- 4. 连接服务器 -----\n");

    /*
     * connect(套接字, 服务器地址结构体, 地址结构体大小)
     * 这是一个阻塞调用，直到连接建立或超时才返回
     */
    ret = connect(client_sock, (struct sockaddr *)&server_addr,
                  sizeof(server_addr));
    if (ret == SOCKET_ERROR) {
        print_socket_error("连接服务器失败");
        close_socket(client_sock);
#ifdef _WIN32
        WSACleanup();
#endif
        return 1;
    }
    printf("成功连接到 %s:%d\n\n", host, port);

    /* ===== 5. 发送 HTTP 请求 ===== */
    printf("----- 5. 发送 HTTP GET 请求 -----\n");

    /* 构造 HTTP GET 请求 */
    char request[512];
    /* 请求路径 /get 会返回请求信息（包含我们的 IP 等） */
    snprintf(request, sizeof(request),
             "GET /get HTTP/1.1\r\n"
             "Host: %s\r\n"
             "Connection: close\r\n"
             "User-Agent: C-TCP-Client/1.0\r\n"
             "\r\n",
             host);

    printf("发送请求 (%zu 字节):\n%s\n", strlen(request), request);

    /*
     * send(套接字, 数据缓冲区, 数据长度, 标志)
     * 返回实际发送的字节数，失败返回 SOCKET_ERROR
     * 标志位通常为 0
     */
    int bytes_sent = send(client_sock, request, (int)strlen(request), 0);
    if (bytes_sent == SOCKET_ERROR) {
        print_socket_error("发送数据失败");
    } else {
        printf("已发送 %d 字节。\n\n", bytes_sent);
    }

    /* ===== 6. 接收服务器响应 ===== */
    printf("----- 6. 接收服务器响应 -----\n");

    /*
     * recv(套接字, 接收缓冲区, 缓冲区大小, 标志)
     * 返回接收到的字节数
     * 返回 0 表示连接已关闭
     * 返回 SOCKET_ERROR 表示出错
     *
     * 由于我们指定了 Connection: close，服务器发送完数据后会关闭连接
     * recv 会在连接关闭时返回 0，我们据此判断接收完毕
     */
    char buffer[BUFFER_SIZE];
    int total_received = 0;

    printf("等待接收响应...\n");

    while (1) {
        int bytes_received = recv(client_sock, buffer, BUFFER_SIZE - 1, 0);

        if (bytes_received > 0) {
            buffer[bytes_received] = '\0';  /* 添加字符串结束符 */
            printf("%s", buffer);
            total_received += bytes_received;
        } else if (bytes_received == 0) {
            /* 连接关闭，接收完毕 */
            printf("\n--- 连接关闭，接收完毕 ---\n");
            break;
        } else {
            /* 接收出错 */
            print_socket_error("接收数据失败");
            break;
        }
    }

    printf("\n总共接收 %d 字节。\n\n", total_received);

    /* ===== 7. 清理资源 ===== */
    printf("----- 7. 清理资源 -----\n");

    close_socket(client_sock);
    printf("套接字已关闭。\n");

#ifdef _WIN32
    WSACleanup();
    printf("Winsock 已清理。\n");
#endif

    printf("\n============================================\n");
    printf("  程序结束\n");
    printf("============================================\n");

    return 0;
}
