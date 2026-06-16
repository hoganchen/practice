/**
 * ============================================================
 * 知识点: 定宽整数类型 (Fixed-Width Integer Types)
 *
 * 标准C99引入了<stdint.h>和<inttypes.h>头文件,提供了跨平台
 * 的定宽整数类型。在不同架构(32位/64位)和不同编译器之间,
 * 传统的 int/long 大小可能不同,使用定宽类型可以确保行为一致。
 *
 * <stdint.h> 提供的类型:
 *   int8_t, int16_t, int32_t, int64_t    - 有符号定宽整数
 *   uint8_t, uint16_t, uint32_t, uint64_t - 无符号定宽整数
 *   int_leastN_t, uint_leastN_t           - 至少N位的最小型
 *   int_fastN_t, uint_fastN_t             - 至少N位的最快型
 *   intptr_t, uintptr_t                   - 足以存放指针的整数
 *   intmax_t, uintmax_t                   - 最大宽度整数
 *
 * <inttypes.h> 提供的格式化宏:
 *   PRIdN / PRIiN               - 打印有符号N位整数的格式
 *   PRIuN / PRIxN / PRIXN       - 打印无符号/十六进制
 *   SCNdN / SCNuN               - 读取有符号/无符号N位整数
 *   例: printf("%" PRId32 "\n", val32);
 *
 * 编译指令:
 *   gcc 05_fixed_width_integers.c -o 05_fixed_width_integers.exe -std=c11 -Wall
 * 运行:
 *   ./05_fixed_width_integers.exe
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdint.h>   /* 定宽整数类型 */
#include <inttypes.h> /* PRI/SCN 格式化宏 */

int main(void)
{
    printf("========================================\n");
    printf("  定宽整数类型 (Fixed-Width Integers)\n");
    printf("========================================\n\n");

    /* ======== 1. 基本定宽类型声明与赋值 ======== */
    printf("======== 1. 基本定宽类型 ========\n");

    /* 有符号定宽整数: 精确占用指定位数 */
    int8_t   s8  = -128;        /* 8位有符号,范围: -128 ~ 127 */
    int16_t  s16 = -32768;      /* 16位有符号,范围: -32768 ~ 32767 */
    int32_t  s32 = -2147483647 - 1; /* 32位有符号 */
    int64_t  s64 = -9223372036854775807LL - 1; /* 64位有符号 */

    /* 无符号定宽整数: 范围 0 ~ 2^N-1 */
    uint8_t  u8  = 255;         /* 8位无符号,范围: 0 ~ 255 */
    uint16_t u16 = 65535;       /* 16位无符号,范围: 0 ~ 65535 */
    uint32_t u32 = 4294967295U; /* 32位无符号 */
    uint64_t u64 = 18446744073709551615ULL; /* 64位无符号 */

    /* 使用 PRI 宏进行格式化输出(保证跨平台正确) */
    printf("int8_t   (%%\" PRId8 \"):   %" PRId8 "\n", s8);
    printf("int16_t  (%%\" PRId16 \"):  %" PRId16 "\n", s16);
    printf("int32_t  (%%\" PRId32 \"):  %" PRId32 "\n", s32);
    printf("int64_t  (%%\" PRId64 \"):  %" PRId64 "\n", s64);
    printf("\n");
    printf("uint8_t  (%%\" PRIu8 \"):   %" PRIu8 "\n", u8);
    printf("uint16_t (%%\" PRIu16 \"):  %" PRIu16 "\n", u16);
    printf("uint32_t (%%\" PRIu32 \"):  %" PRIu32 "\n", u32);
    printf("uint64_t (%%\" PRIu64 \"):  %" PRIu64 "\n", u64);

    /* 用十六进制打印无符号整数 */
    printf("uint32_t 十六进制: 0x%08" PRIx32 "\n", u32);
    printf("uint64_t 十六进制: 0x%016" PRIx64 "\n\n", u64);

    /* ======== 2. 检查各类型的大小 ======== */
    printf("======== 2. 各类型的大小(字节) ========\n");
    printf("sizeof(int8_t)   = %zu 字节\n", sizeof(int8_t));
    printf("sizeof(int16_t)  = %zu 字节\n", sizeof(int16_t));
    printf("sizeof(int32_t)  = %zu 字节\n", sizeof(int32_t));
    printf("sizeof(int64_t)  = %zu 字节\n", sizeof(int64_t));
    printf("sizeof(uint8_t)  = %zu 字节\n", sizeof(uint8_t));
    printf("sizeof(uint16_t) = %zu 字节\n", sizeof(uint16_t));
    printf("sizeof(uint32_t) = %zu 字节\n", sizeof(uint32_t));
    printf("sizeof(uint64_t) = %zu 字节\n\n", sizeof(uint64_t));

    /* ======== 3. int_leastN_t 和 int_fastN_t ======== */
    printf("======== 3. 最小保证宽度和最快类型 ========\n");
    /*
     * int_leastN_t: 至少N位的"最小"类型(内存占用最小)
     * int_fastN_t:  至少N位的"最快"类型(CPU处理最快)
     *
     * 例如在大多数32位系统上:
     *   int_least8_t 可能是 int8_t  (1字节)
     *   int_fast8_t  可能是 int32_t (4字节,但CPU处理32位更快)
     */

    int_least8_t  least8  = 100;
    int_least16_t least16 = 1000;
    int_fast8_t   fast8   = 100;
    int_fast16_t  fast16  = 1000;

    printf("int_least8_t 大小: %zu 字节\n", sizeof(least8));
    printf("int_least16_t大小: %zu 字节\n", sizeof(least16));
    printf("int_fast8_t  大小: %zu 字节\n", sizeof(fast8));
    printf("int_fast16_t 大小: %zu 字节\n\n", sizeof(fast16));

    /* ======== 4. intptr_t / uintptr_t (指针大小整数) ======== */
    printf("======== 4. 指针大小整数 intptr_t / uintptr_t ========\n");
    /*
     * intptr_t 和 uintptr_t 是足以存放指针值的整数类型。
     * 在32位系统上是32位,在64位系统上是64位。
     * 用于将指针转换为整数进行数值操作(谨慎使用)。
     */
    int x = 42;
    intptr_t ptr_as_int = (intptr_t)&x;
    uintptr_t ptr_as_uint = (uintptr_t)&x;

    printf("变量 x 的地址(作为intptr_t): 0x%" PRIxPTR "\n", ptr_as_int);
    printf("变量 x 的地址(作为uintptr_t): 0x%" PRIxPTR "\n", ptr_as_uint);
    printf("intptr_t  大小: %zu 字节\n", sizeof(intptr_t));
    printf("uintptr_t 大小: %zu 字节\n", sizeof(uintptr_t));
    printf("说明: 在 %zu 位系统上运行\n\n", sizeof(intptr_t) * 8);

    /* ======== 5. 使用 SCN 宏进行输入 ======== */
    printf("======== 5. SCN 输入格式宏 ========\n");
    printf("输入格式宏用于 scanf 系列函数:\n");
    printf("  SCNd32 用于 int32_t 的十进制输入\n");
    printf("  SCNu64 用于 uint64_t 的无符号十进制输入\n");
    printf("  SCNx32 用于 uint32_t 的十六进制输入\n\n");

    /* ======== 6. 最大值和最小值常量 ======== */
    printf("======== 6. 各类型的极限值 ========\n");
    printf("INT8_MIN   = %" PRId8 "\n", INT8_MIN);
    printf("INT8_MAX   = %" PRId8 "\n", INT8_MAX);
    printf("UINT8_MAX  = %" PRIu8 "\n", UINT8_MAX);
    printf("INT16_MIN  = %" PRId16 "\n", INT16_MIN);
    printf("INT16_MAX  = %" PRId16 "\n", INT16_MAX);
    printf("UINT16_MAX = %" PRIu16 "\n", UINT16_MAX);
    printf("INT32_MIN  = %" PRId32 "\n", INT32_MIN);
    printf("INT32_MAX  = %" PRId32 "\n", INT32_MAX);
    printf("UINT32_MAX = %" PRIu32 "\n", UINT32_MAX);
    printf("INT64_MIN  = %" PRId64 "\n", INT64_MIN);
    printf("INT64_MAX  = %" PRId64 "\n", INT64_MAX);
    printf("UINT64_MAX = %" PRIu64 "\n\n", UINT64_MAX);

    /* ======== 7. 跨平台移植性演示 ======== */
    printf("======== 7. 跨平台移植性说明 ========\n");
    printf("在传统C中:\n");
    printf("  int 大小: %zu 字节(平台相关)\n", sizeof(int));
    printf("  long 大小: %zu 字节(平台相关)\n", sizeof(long));
    printf("\n使用定宽类型可以保证:\n");
    printf("  无论在哪种平台,int32_t 始终是 32 位(4 字节)\n");
    printf("  uint64_t 始终是 64 位(8 字节)\n");
    printf("\n适用于:\n");
    printf("  - 网络协议解析(数据包结构固定)\n");
    printf("  - 二进制文件格式读写\n");
    printf("  - 嵌入式系统(寄存器映射)\n");
    printf("  - 跨平台库开发\n\n");

    /* ======== 8. 类型范围边界测试 ======== */
    printf("======== 8. 边界测试 ========\n");

    /* uint8_t 溢出: 255 + 1 = 0 (回绕) */
    uint8_t overflow_test = 255;
    printf("uint8_t: 255 + 1 = %" PRIu8 " (溢出回绕)\n",
           (uint8_t)(overflow_test + 1));

    /* int8_t 溢出: 127 + 1 = -128 (有符号溢出,未定义行为!) */
    int8_t signed_overflow = 127;
    printf("int8_t: 127 + 1 = %" PRId8 " (有符号溢出,结果由实现定义)\n",
           (int8_t)(signed_overflow + 1));

    return 0;
}
