/*
 * 知识点：C 语言字符串基础 —— 字符数组与 null 终止符 (String Basics)
 *
 * 本程序演示 C 语言中字符串的本质，包括：
 *   1. 字符串本质上是 char 数组，以 '\0'（null 终止符）结尾
 *   2. 字符串字面量 vs 字符数组的区别
 *   3. strlen() 获取字符串长度（不包括 '\0'）
 *   4. sizeof 与 strlen 的区别
 *   5. 字符串的修改与只读字符串字面量
 *
 * 核心概念：
 *   C 语言中没有独立的字符串类型，字符串就是 char 数组 + '\0' 终止符。
 *   所有标准字符串函数都依赖 '\0' 来判断字符串结束。
 *
 * 编译与运行：
 *   gcc 01_string_basics.c -o 01_string_basics.exe -std=c11 -Wall
 *   ./01_string_basics.exe
 */

#include "../common/charset.h"
#include <stdio.h>
#include <string.h>  // 提供 strlen 等字符串函数

int main(void)
{
    /* ========== 1. 字符串的本质：字符数组 + '\0' ========== */

    /*
     * 字符串是 char 类型的数组，以 '\0'（ASCII 码 0）结尾。
     * '\0' 称为 null 终止符，标志着字符串结束。
     *
     * 下面的两种声明方式是等价的：
     */
    char str1[6] = { 'H', 'e', 'l', 'l', 'o', '\0' };  // 逐个字符初始化，明确加上 '\0'
    char str2[6] = "Hello";                               // 字符串字面量，"Hello" 自动包含 '\0'

    printf("=== 字符串的本质 ===\n");
    printf("str1 = %s\n", str1);
    printf("str2 = %s\n\n", str2);

    // 验证 '\0' 的存在
    printf("str2[0] = '%c' (%d)\n", str2[0], (int)str2[0]);  // 'H'
    printf("str2[5] = '%c' (%d)  <- 这就是 '\\0'！\n\n", str2[5], (int)str2[5]);


    /* ========== 2. 缺少 '\0' 的后果 ========== */

    /*
     * 如果字符数组没有以 '\0' 结尾，printf("%s") 会继续读取内存
     * 直到遇到 '\0' 为止——这会导致输出乱码甚至崩溃！
     */
    printf("=== 缺少 '\\0' 的后果 ===\n");

    char no_null[5] = { 'H', 'e', 'l', 'l', 'o' };  // 没有 '\0'！
    (void)no_null;  // 抑制未使用警告，仅用于演示
    // printf("没有 '\\0' 的字符串：%s\n", no_null);  // 危险！未定义行为！
    printf("（注释掉了 printf 没有 '\\0' 的代码，因为这是未定义行为）\n\n");


    /* ========== 3. strlen() 获取字符串长度 ========== */

    /*
     * strlen() 计算从起始位置到第一个 '\0' 之间的字符数（不包括 '\0'）
     * 声明在 <string.h> 中
     * 返回类型是 size_t（无符号整数）
     */

    printf("=== strlen() 获取长度 ===\n");

    char *greeting = "Hello, World!";
    size_t len = strlen(greeting);

    printf("字符串：\"%s\"\n", greeting);
    printf("strlen = %zu（字符个数，不含 '\\0'）\n", len);

    // strlen 计算的是运行时结果，不是编译时常量
    printf("\n");


    /* ========== 4. sizeof vs strlen ========== */

    /*
     * 重要区别！
     *   sizeof 是运算符，编译时计算，得到的是数组或指针占用的字节数
     *   strlen 是函数，运行时计算，得到的是字符个数（不含 '\0'）
     *
     * 对不同的声明方式，结果不同：
     */

    printf("=== sizeof vs strlen ===\n");

    // 情况 1：字符串存在 char 数组中
    char arr[] = "Hello";  // arr 是 char[6]（包含 '\0' 的位置）
    printf("char arr[] = \"Hello\";\n");
    printf("  sizeof(arr)  = %zu（整个数组的大小 = 6，包括 '\\0'）\n", sizeof(arr));
    printf("  strlen(arr)  = %zu（不含 '\\0' 的字符数 = 5）\n", strlen(arr));

    // 情况 2：字符串存在指针中
    const char *ptr = "Hello";  // ptr 是指针
    printf("const char *ptr = \"Hello\";\n");
    printf("  sizeof(ptr)  = %zu（指针本身的大小 = 8，而不是字符串长度！）\n", sizeof(ptr));
    printf("  strlen(ptr)  = %zu（正确，计算字符个数）\n\n", strlen(ptr));


    /* ========== 5. 字符串字面量是只读的！ ========== */

    /*
     * 字符串字面量（如 "Hello"）存储在只读数据段（text 段 / rodata 段）
     * 尝试修改字符串字面量会导致未定义行为（通常是崩溃）
     */

    printf("=== 字符串字面量 vs 可修改数组 ===\n");

    // 可修改：存储在栈上的数组
    char mutable[] = "Modify me";
    mutable[0] = 'm';  // OK：栈上的数组可以修改
    printf("可修改的 char 数组：%s\n", mutable);

    // 只读：字符串字面量
    const char *readonly = "Read only";
    // readonly[0] = 'r';  // 错误！修改字符串字面量是未定义行为！
    printf("只读字符串字面量：%s\n\n", readonly);


    /* ========== 6. 空字符串 ========== */

    printf("=== 空字符串 ===\n");

    char empty1[] = "";       // 空字符串数组，大小 = 1（只含 '\0'）
    char empty2[1] = { '\0' }; // 等价
    (void)empty2;  // 抑制未使用警告

    printf("空字符串 \"\"：strlen = %zu, sizeof = %zu\n",
           strlen(empty1), sizeof(empty1));
    printf("empty1[0] = %d（就是 '\\0'）\n", (int)empty1[0]);
    printf("\n");


    /* ========== 7. 字符串的结束：'\\0' 的位置 ========== */

    /*
     * 即使字符数组比字符串大，strlen 也只统计到第一个 '\0' 为止
     */
    printf("=== '\\0' 的终止作用 ===\n");

    char buffer[20] = "Short";  // buffer[0..4] = "Short", buffer[5] = '\0'
    // 但 buffer 有 20 个字节，其余未初始化（或自动为 0）

    printf("buffer = \"%s\"\n", buffer);
    printf("strlen(buffer) = %zu\n", strlen(buffer));  // 5
    printf("sizeof(buffer) = %zu\n\n", sizeof(buffer)); // 20


    /* ========== 8. 字符数组与字符串的容量 ========== */

    /*
     * 声明 char 数组来存储字符串时，记得留出 '\0' 的位置！
     * 比如要存 "Hello"（5 个字符），数组至少要有 6 个元素
     */
    printf("=== 数组长度至少要能容纳 '\\0' ===\n");

    char small[3] = "Hi";   // 刚好够：'H', 'i', '\0'
    printf("small = \"%s\", len = %zu, size = %zu\n",
           small, strlen(small), sizeof(small));

    // 危险示例（请勿尝试）：
    // char too_small[3] = "Hello";  // 编译警告！字符串超长，缺少 '\0' 的空间

    return 0;
}
