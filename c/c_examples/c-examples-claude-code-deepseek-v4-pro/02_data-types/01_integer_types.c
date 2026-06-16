/*
 * ============================================
 * 知识点：整型数据类型
 * 说明：
 *   C语言提供了多种整型，以适应不同范围
 *   和精度的需求。主要整型包括：
 *   - char:    1字节，-128~127 或 0~255
 *   - short:   2字节，-32768~32767
 *   - int:     4字节，-21亿~21亿
 *   - long:    4或8字节（取决于平台）
 *   - long long: 8字节
 *
 *   加上 unsigned 表示无符号（只能表示非负数）
 *
 * 编译方法：
 *   gcc 01_integer_types.c -o 01_integer_types
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <limits.h>  // 提供各种整型的最大值和最小值常量

int main() {
    // ========== 基本整型声明与初始化 ==========

    // char 类型：最小整型，通常用于存储字符或小整数
    char c = 'A';             // 字符 'A' 的 ASCII 码是 65
    char small = 100;         // 也可以直接存储小整数

    // short 类型：短整型
    short s = 32000;

    // int 类型：最常用的整型
    int i = 1000000;

    // long 类型：长整型
    long l = 1000000L;        // 可以在数字后加 L 后缀

    // long long 类型：长长整型（C99标准引入）
    long long ll = 10000000000LL;  // 使用 LL 后缀

    // ========== 无符号类型 ==========
    // unsigned 表示只能存储非负数，范围更大
    unsigned char uc = 200;          // 0~255
    unsigned int ui = 4000000000U;   // 0~42亿
    unsigned long long ull = 100ULL; // 使用 ULL 后缀

    // ========== sizeof 运算符 ==========
    // sizeof 可以获取数据类型或变量占用的字节数
    printf("===== 整型类型占用字节数 =====\n");
    printf("char         : %zu 字节\n", sizeof(char));
    printf("short        : %zu 字节\n", sizeof(short));
    printf("int          : %zu 字节\n", sizeof(int));
    printf("long         : %zu 字节\n", sizeof(long));
    printf("long long    : %zu 字节\n", sizeof(long long));
    printf("unsigned int : %zu 字节\n", sizeof(unsigned int));

    // ========== 打印取值范围 ==========
    printf("\n===== 取值范围（来自 limits.h） =====\n");
    printf("char          : %d 到 %d\n", CHAR_MIN, CHAR_MAX);
    printf("short         : %d 到 %d\n", SHRT_MIN, SHRT_MAX);
    printf("int           : %d 到 %d\n", INT_MIN, INT_MAX);
    printf("long          : %ld 到 %ld\n", LONG_MIN, LONG_MAX);
    printf("long long     : %lld 到 %lld\n", LLONG_MIN, LLONG_MAX);
    printf("unsigned int  : 0 到 %u\n", UINT_MAX);

    // ========== 打印各变量值 ==========
    printf("\n===== 变量值示例 =====\n");
    printf("char c = '%c' (ASCII: %d)\n", c, c);
    printf("short s = %d\n", s);
    printf("int i = %d\n", i);
    printf("long l = %ld\n", l);
    printf("long long ll = %lld\n", ll);
    printf("unsigned char uc = %u\n", uc);
    printf("unsigned int ui = %u\n", ui);

    // ========== 格式化说明符 ==========
    /*
     * printf 中整型的格式化说明符：
     * %d 或 %i — int（有符号十进制）
     * %u       — unsigned int（无符号十进制）
     * %hd      — short
     * %ld      — long
     * %lld     — long long
     * %zu      — size_t（sizeof 的返回类型）
     * %x 或 %X — 十六进制输出
     * %o       — 八进制输出
     */

    printf("\n===== 不同进制输出 =====\n");
    int value = 255;
    printf("十进制: %d\n", value);
    printf("八进制: %o\n", value);
    printf("十六进制: %x (小写) / %X (大写)\n", value, value);

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. 根据数据范围选择合适的整型，避免溢出
 * 2. unsigned 可以扩大正数范围，但不能表示负数
 * 3. sizeof() 可以获取类型或变量的大小
 * 4. 不同平台的 int/long 大小可能不同
 * 5. 使用 limits.h 可以获取类型的范围常量
 * ============================================
 */
