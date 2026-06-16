/*
 * ============================================================
 *  知识点: 整数数据类型（Integer Data Types）
 *
 *  本文件覆盖以下核心概念:
 *    1. short、int、long、long long 四种整数类型
 *    2. signed（有符号）与 unsigned（无符号）的区别
 *    3. sizeof 运算符 —— 计算类型或变量占用的字节数
 *    4. <limits.h> 头文件 —— 各类型的最大值和最小值
 *    5. 溢出问题（overflow）
 *
 *  编译指令:
 *    gcc 01_integer_types.c -o 01_integer_types.exe -std=c11 -Wall
 *
 *  运行指令:
 *    ./01_integer_types.exe
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <limits.h>     /* 包含各整数类型的 MIN/MAX 常量 */

int main(void)
{
    printf("========================================\n");
    printf("       C语言整数类型详解\n");
    printf("========================================\n\n");

    /*
     * ============================================
     *  1. sizeof 运算符
     * ============================================
     *
     *  sizeof 是 C 语言的"运算符"（不是函数），
     *  在编译时计算类型或变量所占的字节数。
     *  用法:
     *    sizeof(type)    —— 计算类型的大小
     *    sizeof variable —— 计算变量的大小
     *  返回值类型: size_t（在 <stddef.h> 中定义，通常是无符号整型）
     *  使用 %zu 格式化输出 size_t
     */
    printf("===== 1. sizeof 运算符 —— 各类型占用的字节数 =====\n");
    printf("sizeof(char)      = %zu 字节\n", sizeof(char));
    printf("sizeof(short)     = %zu 字节\n", sizeof(short));
    printf("sizeof(int)       = %zu 字节\n", sizeof(int));
    printf("sizeof(long)      = %zu 字节\n", sizeof(long));
    printf("sizeof(long long) = %zu 字节\n", sizeof(long long));
    printf("\n");
    printf("sizeof(unsigned int)       = %zu 字节\n", sizeof(unsigned int));
    printf("sizeof(unsigned long long) = %zu 字节\n\n", sizeof(unsigned long long));

    /*
     * 注意: 以上大小是"至少"的保证（C标准要求）:
     *   char     >= 1 字节（至少 8 位）
     *   short    >= 2 字节（至少 16 位）
     *   int      >= 2 字节（通常 4 字节）
     *   long     >= 4 字节（在 Windows 上 4 字节，Linux 64 位上是 8 字节）
     *   long long >= 8 字节（至少 64 位）
     *
     * 不同平台/编译器可能有差异，所以 sizeof 很重要！
     */

    /*
     * ============================================
     *  2. <limits.h> 中的 MIN/MAX 常量
     * ============================================
     *
     *  <limits.h> 定义了各整数类型的取值范围常量。
     *  命名规则: [类型前缀]_MIN / [类型前缀]_MAX
     */
    printf("===== 2. <limits.h> 定义的取值范围 =====\n");

    /* char 类型 */
    printf("char 范围: %d ~ %d\n", CHAR_MIN, CHAR_MAX);
    printf("signed char 范围: %d ~ %d\n", SCHAR_MIN, SCHAR_MAX);
    printf("unsigned char 范围: 0 ~ %u\n", UCHAR_MAX);

    /* short 类型 */
    printf("short 范围: %d ~ %d\n", SHRT_MIN, SHRT_MAX);
    printf("unsigned short 范围: 0 ~ %u\n", USHRT_MAX);

    /* int 类型 */
    printf("int 范围: %d ~ %d\n", INT_MIN, INT_MAX);
    printf("unsigned int 范围: 0 ~ %u\n", UINT_MAX);

    /* long 类型 */
    printf("long 范围: %ld ~ %ld\n", LONG_MIN, LONG_MAX);
    printf("unsigned long 范围: 0 ~ %lu\n", ULONG_MAX);

    /* long long 类型 */
    printf("long long 范围: %lld ~ %lld\n", LLONG_MIN, LLONG_MAX);
    printf("unsigned long long 范围: 0 ~ %llu\n\n", ULLONG_MAX);

    /*
     * ============================================
     *  3. signed 与 unsigned 的区别
     * ============================================
     *
     *  signed（有符号）: 最高位是符号位（0正1负），可表示正数和负数
     *  unsigned（无符号）: 所有位都表示数值，只能表示非负数
     *
     *  以 8 位 char 为例:
     *    signed char:  -128 ~ 127（一位符号位 + 7 位数值）
     *    unsigned char:   0 ~ 255（8 位全部是数值）
     *
     *  默认情况下，int、short、long、long long 都是 signed 的。
     */
    printf("===== 3. signed vs unsigned =====\n");

    signed int si = -100;           /* signed 可表示负数 */
    unsigned int ui = 4000000000U;  /* unsigned 可表示更大的正数 */

    printf("signed int: %d\n", si);
    printf("unsigned int: %u\n", ui);

    /*
     * 如果把负数赋值给 unsigned 变量会发生什么？
     * 结果: 负数会被转换成对应的"补码"表示的无符号值
     */
    unsigned int bad_unsigned = -1;     /* 这不会报错，但结果不是 -1 */
    printf("unsigned int 赋值为 -1: %u\n", bad_unsigned);
    printf("  解释: -1 的补码表示被解释为 %u\n\n", UINT_MAX);

    /*
     * ============================================
     *  4. 整数溢出（Integer Overflow）
     * ============================================
     *
     *  当变量的值超出其类型能表示的范围时，发生"溢出"。
     *  有符号整数溢出是"未定义行为"（undefined behavior）!
     *  无符号整数溢出会"回绕"（wrap around），结果对 (最大值+1) 取模。
     */
    printf("===== 4. 整数溢出演示 =====\n");

    /* 有符号整数溢出 —— 未定义行为 */
    int max_int = INT_MAX;
    printf("INT_MAX = %d\n", max_int);
    printf("INT_MAX + 1 = %d （溢出！这是未定义行为）\n", max_int + 1);

    /* 无符号整数溢出 —— 有明确定义的回绕行为 */
    unsigned int max_uint = UINT_MAX;
    printf("\nUINT_MAX = %u\n", max_uint);
    printf("UINT_MAX + 1 = %u （回绕到 0）\n", max_uint + 1);
    printf("UINT_MAX + 2 = %u （回绕到 1）\n\n", max_uint + 2);

    /*
     * ============================================
     *  5. 各种整数类型的声明与使用示例
     * ============================================
     */
    printf("===== 5. 各种整数类型的使用示例 =====\n");

    /* short —— 节省内存，适用于小整数 */
    short small = 32767;
    short small2 = -32768;
    printf("short: %d, %d\n", small, small2);

    /* int —— 最常用的整数类型 */
    int normal = 1000000;
    printf("int: %d\n", normal);

    /* long —— 在有些平台上比 int 更大 */
    long big = 2000000000L;          /* L 后缀表示 long */
    printf("long: %ld\n", big);

    /* long long —— 至少 64 位的大整数 */
    long long huge = 9000000000000000000LL;  /* LL 后缀表示 long long */
    printf("long long: %lld\n", huge);

    /* unsigned 类型示例 */
    unsigned short us = 65535;
    unsigned long long ull = 18000000000000000000ULL;
    printf("unsigned short: %u\n", us);
    printf("unsigned long long: %llu\n", ull);

    /*
     * 在 printf 中格式化不同整数类型:
     *   %d   —— int
     *   %hd  —— short（h 是长度修饰符）
     *   %ld  —— long（l 是长度修饰符）
     *   %lld —— long long（ll 是长度修饰符）
     *   %u   —— unsigned int
     *   %hu  —— unsigned short
     *   %lu  —— unsigned long
     *   %llu —— unsigned long long
     */

    return 0;
}
