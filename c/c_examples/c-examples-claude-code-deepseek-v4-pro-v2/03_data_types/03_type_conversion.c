/*
 * ============================================================
 *  知识点: 类型转换与强制类型转换（Type Conversion and Casting）
 *
 *  本文件覆盖以下核心概念:
 *    1. 隐式转换（Implicit Conversion）
 *       - 整型提升（Integer Promotion）
 *       - 寻常算术转换（Usual Arithmetic Conversions）
 *    2. 显式转换（Explicit Conversion / Cast）
 *    3. 窄化转换（Narrowing Conversion）可能导致数据丢失
 *    4. 赋值时的类型转换
 *
 *  编译指令:
 *    gcc 03_type_conversion.c -o 03_type_conversion.exe -std=c11 -Wall
 *
 *  运行指令:
 *    ./03_type_conversion.exe
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>

int main(void)
{
    printf("========================================\n");
    printf("       类型转换与强制类型转换\n");
    printf("========================================\n\n");

    /*
     * ============================================
     *  1. 隐式转换（Implicit Conversion）
     * ============================================
     *
     *  编译器自动进行的类型转换，不需要程序员显式写出。
     *
     *  (a) 整型提升（Integer Promotion）
     *      在表达式中，char 和 short 会被提升为 int。
     *      如果 int 无法容纳，则提升为 unsigned int。
     *
     *  (b) 寻常算术转换（Usual Arithmetic Conversions）
     *      当操作数类型不同时，编译器会将"较低"类型提升为"较高"类型。
     *      转换等级（从低到高）:
     *        int -> unsigned int -> long -> unsigned long
     *        -> long long -> unsigned long long -> float
     *        -> double -> long double
     */
    printf("===== 1. 隐式转换 =====\n");

    /* 整型提升示例 */
    char c1 = 10, c2 = 20;
    /*
     * c1 + c2 中，c1 和 c2 先被提升为 int 再相加
     * 结果类型是 int，而不是 char
     */
    int int_result = c1 + c2;   /* 隐式提升: char -> int */
    printf("整型提升: %d + %d = %d (int 类型)\n", c1, c2, int_result);

    /* 不同整数类型的混合运算 */
    short s = 100;
    int i = 200;
    long l = 300L;
    long long ll = 400LL;

    /*
     * 混合运算时，所有操作数会被提升为运算中"最高"的类型
     * s + i    -> int 结果（short 提升为 int）
     * i + l    -> long 结果（int 提升为 long）
     * l + ll   -> long long 结果（long 提升为 long long）
     */
    printf("short + int       = %ld (类型: long)\n", (long)(s + i));
    printf("int + long        = %ld (类型: long)\n", (long)(i + l));
    printf("long + long long  = %lld (类型: long long)\n", (long long)(l + ll));

    /* 整数与浮点数的混合运算 */
    int x = 5;
    double y = 2.0;
    /*
     * x / y 中，x 被提升为 double
     * 结果是 double 类型
     */
    double result = x / y;
    printf("int / double = %.2f (类型: double)\n\n", result);

    /*
     * ============================================
     *  2. 显式转换（Explicit Conversion / Cast）
     * ============================================
     *
     *  程序员使用强制类型转换运算符 (type) 手动转换类型。
     *  语法: (目标类型)表达式
     *
     *  什么时候需要显式转换?
     *    - 整数除法要得到小数结果
     *    - 需要将较大类型安全地缩小
     *    - 指针类型转换
     */
    printf("===== 2. 显式转换（强制类型转换）=====\n");

    /* 整数除法 vs 浮点数除法 */
    int num1 = 7, num2 = 3;
    double div_result;

    div_result = num1 / num2;               /* 整数除法！结果为 2，然后转 double */
    printf("整数除法 (无转换): %d / %d = %.2f\n", num1, num2, div_result);

    div_result = (double)num1 / num2;       /* 将 num1 转为 double，除法得到 double */
    printf("强制转换 num1: (double)%d / %d = %.2f\n", num1, num2, div_result);

    div_result = num1 / (double)num2;       /* 将 num2 转为 double */
    printf("强制转换 num2: %d / (double)%d = %.2f\n", num1, num2, div_result);

    div_result = (double)(num1 / num2);     /* 错误！先整数除法再转 double，还是 2 */
    printf("错误转换: (double)(%d / %d) = %.2f (先做整数除法！)\n\n", num1, num2, div_result);

    /*
     * ============================================
     *  3. 窄化转换（Narrowing Conversion）可能导致数据丢失
     * ============================================
     *
     *  窄化转换: 将较"宽"的类型转换为较"窄"的类型。
     *  可能丢失数据，编译器通常会发出警告。
     *
     *  常见场景:
     *    double -> float（精度丢失）
     *    int -> short（范围缩小）
     *    long -> int（可能溢出）
     *    double -> int（小数部分被截断，不是四舍五入！）
     */
    printf("===== 3. 窄化转换（数据丢失风险）=====\n");

    /* double -> int: 小数部分被截断 */
    double pi = 3.14159265;
    int truncated = (int)pi;            /* 小数部分直接被丢弃 */
    printf("double 转 int: (int)%.5f = %d （截断，不是四舍五入）\n", pi, truncated);

    /* 负数的截断 */
    double negative = -3.9;
    int neg_trunc = (int)negative;
    printf("负数: (int)%.1f = %d （向零取整）\n", negative, neg_trunc);

    /* int -> short: 可能溢出 */
    int large = 100000;
    short narrowed = (short)large;      /* short 放不下 100000 */
    printf("int 转 short: (short)%d = %d （数据丢失！）\n", large, narrowed);

    /* double -> float: 精度丢失 */
    double precise = 3.14159265358979;
    float approximate = (float)precise;
    printf("double 转 float: %.15f -> %.15f （精度丢失）\n", precise, (double)approximate);

    /*
     * ============================================
     *  4. 赋值时的类型转换
     * ============================================
     *
     *  赋值操作也会触发隐式转换：
     *    右侧表达式的值被转换为左侧变量的类型
     */
    printf("\n===== 4. 赋值时的类型转换 =====\n");

    int int_val;
    double double_val = 3.99;

    /* double 赋值给 int —— 小数部分被丢弃 */
    int_val = double_val;
    printf("赋值: double %.2f -> int = %d （截断）\n", double_val, int_val);

    /* int 赋值给 double —— 隐式转成 double */
    int_val = 5;
    double_val = int_val;
    printf("赋值: int %d -> double = %.1f （安全提升）\n", int_val, double_val);

    /* char 赋值给 int —— 值被保留，ASCII 码 */
    char ch = 'A';
    int_val = ch;
    printf("赋值: char '%c' -> int = %d (ASCII 码)\n", ch, int_val);

    /*
     * ============================================
     *  5. 有符号与无符号之间的转换
     * ============================================
     */
    printf("\n===== 5. 有符号与无符号的转换 =====\n");

    signed int si = -5;
    unsigned int ui = (unsigned int)si;   /* 负数转无符号 */

    printf("signed int %d -> unsigned int = %u\n", si, ui);
    printf("  解释: 负数的补码表示被解释为大的无符号数\n");

    unsigned int ui2 = 3000000000U;
    signed int si2 = (signed int)ui2;     /* 大无符号转有符号 */

    printf("unsigned int %u -> signed int = %d\n", ui2, si2);
    printf("  解释: 超出 signed int 范围时，结果是实现定义的\n");

    return 0;
}
