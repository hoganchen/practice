/*
 * 知识点：头文件中的函数声明和宏定义 (Header File)
 *
 * 本文件是多文件项目中的头文件，演示：
 *   - 头文件保护 (#ifndef / #define / #endif)
 *   - 函数声明（提供接口给其他源文件使用）
 *   - 宏定义和常量共享
 *   - 内联函数定义
 *
 * 编译说明（配合 helper.c 和 main.c）：
 *   方式一（同时编译）：
 *     gcc main.c helper.c -o multifile_demo.exe -std=c11 -Wall
 *   方式二（分步编译）：
 *     gcc -c helper.c -o helper.o -std=c11 -Wall   （先生成目标文件）
 *     gcc main.c helper.o -o multifile_demo.exe -std=c11 -Wall  （再链接）
 *
 * 运行指令：./multifile_demo.exe
 */

#ifndef HELPER_H          /* 头文件保护开始：如果未定义 HELPER_H */
#define HELPER_H          /* 定义 HELPER_H，防止重复包含 */

#include <stdio.h>        /* 标准 I/O 函数 */
#include <stdlib.h>       /* 标准库函数 */
#include <string.h>       /* 字符串处理函数 */
#include <ctype.h>        /* 字符处理函数 */

/*
 * ===== 宏定义和常量 =====
 */

/* 缓冲区大小常量 */
#define BUFFER_SIZE 256

/* 数组最大容量 */
#define MAX_ARRAY_SIZE 100

/* 数学常量（如果未定义）*/
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

/* 调试宏：仅在 DEBUG 定义时输出调试信息 */
#ifdef DEBUG
#define DEBUG_PRINT(fmt, ...) \
    printf("[DEBUG] %s:%d: " fmt, __FILE__, __LINE__, ##__VA_ARGS__)
#else
#define DEBUG_PRINT(fmt, ...)  /* 空语句，调试信息被完全移除 */
#endif

/* 计算数组元素个数的宏 */
#define ARRAY_SIZE(arr) (sizeof(arr) / sizeof((arr)[0]))

/* 两个值中的最大值和最小值 */
#define MAX(a, b) ((a) > (b) ? (a) : (b))
#define MIN(a, b) ((a) < (b) ? (a) : (b))

/*
 * ===== 函数声明（接口） =====
 * 这些函数在 helper.c 中实现，供 main.c 调用
 */

/**
 * 计算两个整数的和
 * @param a 第一个整数
 * @param b 第二个整数
 * @return a + b 的结果
 */
int add(int a, int b);

/**
 * 计算两个整数的差
 * @param a 第一个整数
 * @param b 第二个整数
 * @return a - b 的结果
 */
int subtract(int a, int b);

/**
 * 计算两个整数的乘积
 * @param a 第一个整数
 * @param b 第二个整数
 * @return a * b 的结果
 */
int multiply(int a, int b);

/**
 * 计算两个整数的商
 * @param a 被除数
 * @param b 除数（不能为 0）
 * @return a / b 的结果；如果 b 为 0，打印错误并返回 0
 */
double divide(int a, int b);

/**
 * 计算阶乘 (递归实现)
 * @param n 非负整数
 * @return n! 的结果；如果 n < 0，返回 0
 */
long long factorial(int n);

/**
 * 判断一个整数是否为素数
 * @param n 要判断的整数
 * @return 1 表示是素数，0 表示不是素数
 */
int is_prime(int n);

/**
 * 将字符串转换为大写
 * @param str 要转换的字符串（会被原地修改）
 */
void to_upper(char *str);

/**
 * 计算字符串中单词的数量
 * @param str 输入字符串
 * @return 单词数量
 */
int word_count(const char *str);

/**
 * 生成指定范围内的随机整数
 * @param min 最小值（包含）
 * @param max 最大值（包含）
 * @return [min, max] 范围内的随机整数
 */
int random_range(int min, int max);

/**
 * 打印数组中的整数
 * @param arr 整数数组
 * @param size 数组元素个数
 */
void print_int_array(const int arr[], int size);

/*
 * ===== 内联函数（直接在头文件中定义） =====
 * 适用于非常小的函数，减少函数调用开销
 * static inline 确保每个编译单元都有函数副本
 */

/**
 * 返回较大的整数（内联实现）
 */
static inline int max_int(int a, int b) {
    return (a > b) ? a : b;
}

/**
 * 返回较小的整数（内联实现）
 */
static inline int min_int(int a, int b) {
    return (a < b) ? a : b;
}

/**
 * 检查字符是否为字母（内联实现）
 */
static inline int is_letter(char c) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
}

#endif  /* HELPER_H 头文件保护结束 */

/*
 * 头文件保护的作用：
 *   1. 防止同一个头文件被多次 #include 导致重复定义错误
 *   2. #ifndef 检查宏是否已定义 -> #define 定义宏 -> #endif 结束
 *   3. 另一种方式是 #pragma once（非标准但广泛支持）
 *
 * 头文件中应该放什么：
 *   - 函数声明（不包含实现）
 *   - 宏定义 (#define)
 *   - 类型定义 (typedef, struct)
 *   - 常量定义 (const 或 enum)
 *   - 内联函数 (static inline)
 *
 * 头文件中不应该放什么：
 *   - 函数定义（除非是 inline 或 static）
 *   - 全局变量定义（应该用 extern 声明，在 .c 文件中定义）
 */
