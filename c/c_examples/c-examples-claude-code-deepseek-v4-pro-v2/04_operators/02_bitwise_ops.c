/*
 * ============================================================
 *  知识点: 位运算符（Bitwise Operators）
 *
 *  本文件覆盖以下核心概念:
 *    1. 位运算符: &（按位与）、|（按位或）、^（按位异或）
 *                     ~（按位取反）、<<（左移）、>>（右移）
 *    2. 实用示例: 设置位、清除位、翻转位、检查位
 *    3. 移位运算的注意事项
 *    4. 掩码（Mask）的概念
 *
 *  编译指令:
 *    gcc 02_bitwise_ops.c -o 02_bitwise_ops.exe -std=c11 -Wall
 *
 *  运行指令:
 *    ./02_bitwise_ops.exe
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdint.h>     /* 提供了 uint8_t、uint16_t 等定宽类型 */

/*
 * 辅助函数: 以二进制形式打印无符号 8 位整数
 * 用于清晰地展示位运算的效果
 */
void print_binary(const char *label, uint8_t value)
{
    printf("%-20s = ", label);
    for (int i = 7; i >= 0; i--)
    {
        /* 从最高位开始，逐位检查并打印 */
        printf("%c", (value & (1 << i)) ? '1' : '0');
        if (i == 4) printf(" ");    /* 中间加空格，方便阅读 */
    }
    printf(" (0x%02X, %3u)\n", value, value);
}

int main(void)
{
    printf("========================================\n");
    printf("         位运算符详解\n");
    printf("========================================\n\n");

    /*
     * 先看一个简单的位运算展示表
     */
    printf("位运算基本规则:\n");
    printf("  AND (&):  0&0=0  0&1=0  1&0=0  1&1=1\n");
    printf("  OR  (|):  0|0=0  0|1=1  1|0=1  1|1=1\n");
    printf("  XOR (^):  0^0=0  0^1=1  1^0=1  1^1=0\n");
    printf("  NOT (~):  ~0=1   ~1=0\n\n");

    uint8_t a = 0b11001100;     /* 二进制字面量（C14 标准支持）*/
    uint8_t b = 0b10101010;     /* 如果编译器不支持，可用 0xCC、0xAA */
    /* 如果编译器不支持 0b 前缀，用下面两行替代 */
    /* uint8_t a = 0xCC; */
    /* uint8_t b = 0xAA; */

    printf("===== 1. 基本位运算 =====\n");
    print_binary("a", a);
    print_binary("b", b);
    printf("\n");

    /* 按位与（AND） —— 用于清零某些位 */
    print_binary("a & b (按位与)", a & b);

    /* 按位或（OR） —— 用于设置某些位 */
    print_binary("a | b (按位或)", a | b);

    /* 按位异或（XOR） —— 相同为 0，不同为 1 */
    print_binary("a ^ b (按位异或)", a ^ b);

    /* 按位取反（NOT） */
    print_binary("~a (按位取反)", (uint8_t)~a);

    printf("\n");

    /*
     * ============================================
     *  2. 移位运算（Shift Operations）
     * ============================================
     *
     *  左移 <<:  将所有位向左移动，右侧补 0
     *            左移 1 位等价于乘以 2
     *            左移 n 位等价于乘以 2^n
     *
     *  右移 >>:  对于无符号数，左侧补 0（逻辑右移）
     *            对于有符号数，行为是实现定义的（通常是算术右移，补符号位）
     *            右移 1 位等价于除以 2（对于正数）
     *
     *  注意: 移位位数不能 >= 类型的位数，否则是未定义行为
     *        sizeof(uint8_t) = 1 字节 = 8 位
     *        所以移位位数应在 0~7 之间
     */
    printf("===== 2. 移位运算 =====\n");

    uint8_t c = 0b00000001;     /* 即 1 */
    print_binary("c", c);

    /* 左移 */
    print_binary("c << 1", c << 1);     /* 乘以 2 */
    print_binary("c << 2", c << 2);     /* 乘以 4 */
    print_binary("c << 3", c << 3);     /* 乘以 8 */
    print_binary("c << 7", c << 7);     /* 乘以 128 */

    uint8_t d = 0b10000000;     /* 即 128 */
    print_binary("\nd (128)", d);

    /* 右移 */
    print_binary("d >> 1", d >> 1);     /* 除以 2 */
    print_binary("d >> 2", d >> 2);     /* 除以 4 */
    print_binary("d >> 3", d >> 3);     /* 除以 8 */
    print_binary("d >> 7", d >> 7);     /* 除以 128 */

    /*
     * 有符号整数右移 —— 通常为算术右移（补符号位）
     */
    int8_t negative = -16;      /* 二进制: 11110000 */
    printf("\n有符号右移: -16 >> 2 = %d (算术右移，补符号位)\n", negative >> 2);

    printf("\n");

    /*
     * ============================================
     *  3. 实用位运算技巧
     * ============================================
     *
     *  常用于嵌入式编程、状态标志、权限管理等场景。
     *  通常使用一个整数的不同位来表示不同的"标志"（flag）。
     */

    /* 假设我们用一个 uint8_t 的各位表示 8 种不同的开关状态 */
    uint8_t flags = 0;          /* 初始所有位为 0，所有开关关闭 */
    print_binary("初始 flags", flags);

    /*
     * (a) 设置某一位（Set bit）—— 使用 OR 运算符
     *     将第 3 位（位编号从 0 开始）设为 1
     */
    printf("\n===== 3. 实用位运算技巧 =====\n");
    printf("(a) 设置第 3 位:\n");
    flags = flags | (1 << 3);   /* 等价于 flags |= (1 << 3); */
    print_binary("flags |= (1<<3)", flags);

    /*
     * (b) 清除某一位（Clear bit）—— 使用 AND 和 NOT
     *     将第 3 位设为 0
     */
    printf("(b) 清除第 3 位:\n");
    flags = flags & ~(1 << 3);  /* 等价于 flags &= ~(1 << 3); */
    print_binary("flags &= ~(1<<3)", flags);

    /*
     * (c) 翻转某一位（Toggle bit）—— 使用 XOR
     *     如果该位为 1 则变为 0，为 0 则变为 1
     */
    printf("(c) 翻转第 0 位:\n");
    flags = flags ^ (1 << 0);   /* 等价于 flags ^= (1 << 0); */
    print_binary("flags ^= (1<<0)", flags);
    flags = flags ^ (1 << 0);   /* 再翻转一次 */
    print_binary("再翻转一次", flags);

    /*
     * (d) 检查某一位（Check bit）—— 使用 AND
     *     检查第 3 位是否为 1
     */
    printf("(d) 检查第 3 位:\n");
    flags |= (1 << 3);          /* 先设置第 3 位 */
    print_binary("flags (设第3位)", flags);

    if (flags & (1 << 3))
    {
        printf("第 3 位是 1\n");
    }
    else
    {
        printf("第 3 位是 0\n");
    }

    /*
     * (e) 使用掩码一次操作多个位
     */
    printf("\n(e) 使用掩码操作多个位:\n");

    uint8_t mask = 0b00001111;  /* 低 4 位的掩码 */
    print_binary("mask (低4位掩码)", mask);

    /* 设置低 4 位为 1 */
    flags = 0xF0;               /* 初始: 11110000 */
    print_binary("初始 flags", flags);
    flags = flags | mask;       /* 设置低 4 位 */
    print_binary("flags |= mask", flags);

    /* 清除低 4 位 */
    flags = flags & ~mask;
    print_binary("flags &= ~mask", flags);

    /*
     * ============================================
     *  4. 位运算的实际应用示例
     * ============================================
     */
    printf("\n===== 4. 实际应用示例 =====\n");

    /*
     * 示例 1: 用位运算判断一个数是否是 2 的幂
     * 2 的幂的特点: 二进制表示中只有一个 1
     * n & (n - 1) 会清除最低位的 1
     * 如果是 2 的幂，n & (n - 1) == 0
     */
    printf("示例 1: 判断 2 的幂\n");
    for (int i = 1; i <= 32; i *= 2)
    {
        int n = i;
        int is_power_of_two = (n > 0) && ((n & (n - 1)) == 0);
        printf("  %2d 是 2 的幂: %s\n", n, is_power_of_two ? "是" : "否");
    }
    printf("  6 是 2 的幂: %s\n", ((6 > 0) && ((6 & (6 - 1)) == 0)) ? "是" : "否");

    /*
     * 示例 2: 使用异或交换两个数（不需要临时变量）
     * 原理: a ^ a = 0, a ^ 0 = a
     */
    printf("\n示例 2: 使用 XOR 交换两个数\n");
    int m = 10, n = 20;
    printf("  交换前: m = %d, n = %d\n", m, n);
    m = m ^ n;
    n = m ^ n;      /* n = (m_old ^ n_old) ^ n_old = m_old */
    m = m ^ n;      /* m = (m_old ^ n_old) ^ m_old = n_old */
    printf("  交换后: m = %d, n = %d\n", m, n);

    /*
     * 示例 3: 计算一个整数中 1 的个数
     */
    printf("\n示例 3: 计算二进制中 1 的个数\n");
    uint8_t test = 0b11011010;
    int count = 0;
    uint8_t temp = test;
    while (temp)
    {
        count += temp & 1;      /* 检查最低位 */
        temp >>= 1;             /* 右移一位 */
    }
    print_binary("", test);
    printf("  二进制中 1 的个数: %d\n", count);

    return 0;
}
