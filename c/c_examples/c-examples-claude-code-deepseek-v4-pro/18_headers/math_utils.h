/*
 * ============================================
 * 知识点：头文件设计与多文件编程
 * 说明：
 *   头文件（.h）包含函数声明、宏定义、
 *   类型定义等。源文件（.c）包含实现。
 *
 *   头文件规范：
 *   1. 使用 include guard 防止重复包含
 *   2. 只放声明，不放定义（除非是 inline/static）
 *   3. 声明所有公开的函数和类型
 *
 * 编译方法（在项目目录下执行）：
 *   gcc *.c -o main
 *   或分别编译再链接：
 *   gcc -c main.c math_utils.c
 *   gcc main.o math_utils.o -o main
 * ============================================
 */

#ifndef MATH_UTILS_H          // 防止重复包含（include guard）
#define MATH_UTILS_H

// ========== 函数声明 ==========
int add(int a, int b);
int subtract(int a, int b);
int multiply(int a, int b);
int divide(int a, int b);
int factorial(int n);

// ========== 内联函数（定义在头文件中） ==========
static inline int square(int x) {
    return x * x;
}

// ========== 宏定义 ==========
#define CUBE(x) ((x) * (x) * (x))
#define ABS(x)  ((x) < 0 ? -(x) : (x))

// ========== 类型定义 ==========
typedef struct {
    int x;
    int y;
} Vector2D;

// 声明一个函数
Vector2D vector_add(Vector2D a, Vector2D b);

#endif  // MATH_UTILS_H
