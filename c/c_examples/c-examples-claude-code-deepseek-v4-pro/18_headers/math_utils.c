/*
 * ============================================
 * 源文件：数学工具函数的实现
 * 说明：
 *   这是 math_utils.h 中声明的函数的实现。
 *   #include "math_utils.h" 引入头文件，
 *   编译器检查声明与实现是否一致。
 * ============================================
 */

#include "math_utils.h"  // 引入头文件（自定义用引号）

int add(int a, int b) {
    return a + b;
}

int subtract(int a, int b) {
    return a - b;
}

int multiply(int a, int b) {
    return a * b;
}

int divide(int a, int b) {
    // 实际项目应做除零检查
    if (b == 0) return 0;
    return a / b;
}

int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

Vector2D vector_add(Vector2D a, Vector2D b) {
    Vector2D result;
    result.x = a.x + b.x;
    result.y = a.y + b.y;
    return result;
}
