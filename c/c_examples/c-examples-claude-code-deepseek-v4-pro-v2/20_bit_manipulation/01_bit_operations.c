/*
 * 知识点：位操作实战 (Bit Manipulation)
 *
 * 编译指令：gcc 01_bit_operations.c -o 01_bit_operations.exe -std=c11 -Wall
 * 运行指令：./01_bit_operations.exe
 *
 * 本文件演示 C 语言中的位操作技巧：
 *   - 设置某一位：   x |=  (1 << n)
 *   - 清除某一位：   x &= ~(1 << n)
 *   - 切换某一位：   x ^=  (1 << n)
 *   - 检查某一位：   if (x & (1 << n))
 *   - 使用位掩码 (Bit Mask) 管理多个标志位
 *   - 位域 (Bit Field) 的应用
 *
 * 位操作的应用场景：
 *   - 权限系统（Linux 文件权限 rwx）
 *   - 硬件寄存器编程
 *   - 高效的状态标记（一个 int 可存储 32 个布尔值）
 *   - 数据压缩和编码
 *   - 图形学中的颜色处理
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdint.h>   /* 提供固定宽度的整数类型 */
#include <string.h>

/* ===== 权限系统演示 ===== */

/* 权限位掩码定义（使用 enum 定义一组相关的常量）*/
enum {
    PERM_READ   = 1 << 0,  /* 0001 = 1  — 读权限 */
    PERM_WRITE  = 1 << 1,  /* 0010 = 2  — 写权限 */
    PERM_EXEC   = 1 << 2,  /* 0100 = 4  — 执行权限 */
    PERM_ADMIN  = 1 << 3,  /* 1000 = 8  — 管理权限 */
};

/* 打印权限的二进制表示和含义 */
void print_permissions(unsigned int perms) {
    printf("  权限值: %u (二进制: ", perms);

    /* 从高位到低位打印二进制表示 */
    for (int i = 7; i >= 0; i--) {
        printf("%d", (perms >> i) & 1);
    }

    printf(", 含义: ");
    if (perms & PERM_READ)  printf("读 ");
    if (perms & PERM_WRITE) printf("写 ");
    if (perms & PERM_EXEC)  printf("执行 ");
    if (perms & PERM_ADMIN) printf("管理 ");
    if (perms == 0)         printf("无权限");
    printf(")\n");
}

/* ===== RGB 颜色处理 ===== */

/* 使用位操作提取 RGB 颜色分量 */
void print_color(uint32_t color) {
    /* 常见的 RGB 布局（32位）：0x00RRGGBB
     * 红色分量在 16-23 位，绿色在 8-15 位，蓝色在 0-7 位 */
    unsigned char red   = (color >> 16) & 0xFF;
    unsigned char green = (color >> 8)  & 0xFF;
    unsigned char blue  = color         & 0xFF;

    printf("  颜色值: 0x%06X\n", color & 0xFFFFFF);
    printf("  红色 (R): %u (0x%02X)\n", red, red);
    printf("  绿色 (G): %u (0x%02X)\n", green, green);
    printf("  蓝色 (B): %u (0x%02X)\n", blue, blue);
    printf("  RGB(%u, %u, %u)\n", red, green, blue);
}

/* ===== IP 地址处理 ===== */

/* 将点分十进制 IP 字符串转换为 uint32_t */
uint32_t ip_to_int(const char *ip_str) {
    unsigned int octets[4];
    sscanf(ip_str, "%u.%u.%u.%u", &octets[0], &octets[1],
           &octets[2], &octets[3]);

    /* 将 4 个字节合并为 32 位整数（网络字节序 = 大端）*/
    return (octets[0] << 24) | (octets[1] << 16) |
           (octets[2] << 8)  | octets[3];
}

/* 将 uint32_t 转换回点分十进制字符串 */
void int_to_ip(uint32_t ip_int, char *buffer, size_t buf_size) {
    snprintf(buffer, buf_size, "%u.%u.%u.%u",
             (ip_int >> 24) & 0xFF,
             (ip_int >> 16) & 0xFF,
             (ip_int >> 8)  & 0xFF,
             ip_int & 0xFF);
}

/* ===== 位域结构体 ===== */

/* 使用位域 (Bit Field) 表示日期
 * 位域允许我们以位为单位指定成员占用空间 */
typedef struct {
    unsigned int day   : 5;  /* 1-31，需要 5 位 */
    unsigned int month : 4;  /* 1-12，需要 4 位 */
    unsigned int year  : 7;  /* 0-99，需要 7 位（用于节俭场景）*/
} BitDate;

/* 打印位域结构体的大小和值 */
void print_bit_date(const BitDate *d) {
    printf("  日期: %u/%u/20%02u\n", d->month, d->day, d->year);
    printf("  位域结构体大小: %zu 字节\n", sizeof(BitDate));
}

int main() {
    printf("============================================\n");
    printf("  位操作实战演示\n");
    printf("============================================\n\n");

    /* ===== 1. 基本位操作 ===== */
    printf("----- 1. 基本位操作 (置位/清零/切换/检查) -----\n");

    unsigned char x = 0;  /* 初始值为 00000000 */

    /* 设置第 2 位（从 0 开始计数）为 1 */
    x |= (1 << 2);  /* 00000100 */
    printf("设置第 2 位:  %u (二进制: 00000%u%u%u)\n",
           x, (x >> 2) & 1, (x >> 1) & 1, x & 1);

    /* 设置第 0 位和第 5 位 */
    x |= (1 << 0) | (1 << 5);  /* 00100101 */
    printf("设置第 0,5 位: %u\n", x);

    /* 清除第 2 位 */
    x &= ~(1 << 2);  /* 00100001 */
    printf("清除第 2 位: %u\n", x);

    /* 切换第 5 位（从 1 变成 0）*/
    x ^= (1 << 5);
    printf("切换第 5 位: %u\n", x);

    /* 再次切换第 5 位（从 0 变成 1）*/
    x ^= (1 << 5);
    printf("再次切换:    %u\n", x);

    /* 检查某一位 */
    int bit_0 = (x & (1 << 0)) != 0;
    int bit_3 = (x & (1 << 3)) != 0;
    printf("第 0 位: %d, 第 3 位: %d\n", bit_0, bit_3);

    printf("\n");

    /* ===== 2. 权限系统 ===== */
    printf("----- 2. 权限系统 (位掩码) -----\n");

    unsigned int permissions = 0;

    /* 赋予读取和写入权限 */
    permissions |= PERM_READ | PERM_WRITE;
    printf("赋予读+写权限:\n");
    print_permissions(permissions);

    /* 添加执行权限 */
    permissions |= PERM_EXEC;
    printf("添加执行权限:\n");
    print_permissions(permissions);

    /* 移除写入权限 */
    permissions &= ~PERM_WRITE;
    printf("移除写权限:\n");
    print_permissions(permissions);

    /* 检查是否有管理员权限 */
    if (permissions & PERM_ADMIN) {
        printf("有管理权限\n");
    } else {
        printf("无管理权限\n");
    }

    /* 切换执行权限 */
    permissions ^= PERM_EXEC;
    printf("切换执行权限:\n");
    print_permissions(permissions);

    printf("\n");

    /* ===== 3. RGB 颜色处理 ===== */
    printf("----- 3. RGB 颜色操作 -----\n");

    /* 组合一个颜色：0x00RRGGBB
     * 红色 = 0xFF, 绿色 = 0x80, 蓝色 = 0x00 */
    uint32_t orange = (0xFF << 16) | (0x80 << 8) | 0x00;
    printf("橙色:\n");
    print_color(orange);

    /* 蓝色：0x000000FF */
    uint32_t blue = 0x000000FF;
    printf("\n蓝色:\n");
    print_color(blue);

    /* 修改颜色的红色分量 */
    uint32_t color = 0x00804020;  /* 初始颜色 */
    printf("\n修改红色分量:\n");
    printf("修改前:\n");
    print_color(color);

    /* 将红色分量设为 0xFF */
    color = (color & 0xFF00FFFF) | (0xFF << 16);
    printf("修改后 (红色=255):\n");
    print_color(color);

    printf("\n");

    /* ===== 4. IP 地址处理 ===== */
    printf("----- 4. IP 地址操作 -----\n");

    const char *ip = "192.168.1.100";
    uint32_t ip_int = ip_to_int(ip);
    printf("IP 地址: %s\n", ip);
    printf("整数表示: %u (0x%08X)\n", ip_int, ip_int);

    char ip_back[16];
    int_to_ip(ip_int, ip_back, sizeof(ip_back));
    printf("转回字符串: %s\n", ip_back);

    /* 子网掩码和网络地址的计算 */
    uint32_t mask = 0xFFFFFF00;        /* 255.255.255.0 */
    uint32_t network = ip_int & mask;  /* 网络地址 */
    uint32_t host    = ip_int & ~mask; /* 主机地址 */
    char network_str[16], host_str[16];
    int_to_ip(network, network_str, sizeof(network_str));
    int_to_ip(host, host_str, sizeof(host_str));

    printf("子网掩码: 255.255.255.0\n");
    printf("网络地址: %s\n", network_str);
    printf("主机地址: %s (0x%02X)\n", host_str, host);

    printf("\n");

    /* ===== 5. 位域结构体 ===== */
    printf("----- 5. 位域结构体 (Bit Field) -----\n");

    BitDate today;
    today.day   = 16;
    today.month = 6;
    today.year  = 26;  /* 2026 */

    print_bit_date(&today);

    printf("对比：传统结构体通常需要 3 个 int（12 字节）\n");
    printf("位域结构体只用了 %zu 字节！\n\n", sizeof(BitDate));

    /* ===== 6. 常见位操作技巧 ===== */
    printf("----- 6. 实用位操作技巧 -----\n");

    /* 判断奇偶性：n & 1 */
    for (int n = 0; n <= 5; n++) {
        printf("  %d 是%s数\n", n, (n & 1) ? "奇" : "偶");
    }

    /* 交换两个数（不用临时变量）*/
    int a = 10, b = 20;
    printf("\n  交换前: a=%d, b=%d\n", a, b);
    a ^= b;  /* a = a ^ b */
    b ^= a;  /* b = b ^ (a ^ b) = a */
    a ^= b;  /* a = (a ^ b) ^ a = b */
    printf("  交换后: a=%d, b=%d (使用异或)\n", a, b);

    /* 检查是否为 2 的幂：n > 0 && (n & (n-1)) == 0 */
    printf("\n  检查 2 的幂:\n");
    int test_nums[] = {0, 1, 2, 3, 4, 16, 31, 32, 64, 100};
    for (int i = 0; i < 10; i++) {
        int n = test_nums[i];
        int is_pow2 = (n > 0) && ((n & (n - 1)) == 0);
        printf("    %d %s 2 的幂\n", n, is_pow2 ? "是" : "不是");
    }

    printf("\n============================================\n");
    printf("  程序结束\n");
    printf("============================================\n");

    return 0;
}
