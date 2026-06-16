/*
 * ============================================
 * 主文件：使用 math_utils.h 中的函数
 * 说明：
 *   这个文件演示了多文件编程。通过 #include
 *   引入头文件，使用其中声明的函数和类型。
 *
 * 编译方法：
 *   方式1（一步编译）：
 *     gcc main.c math_utils.c -o main
 *   方式2（分步编译，大项目常用）：
 *     gcc -c main.c          → 生成 main.o
 *     gcc -c math_utils.c    → 生成 math_utils.o
 *     gcc main.o math_utils.o -o main  → 链接
 *   方式3（使用通配符）：
 *     gcc *.c -o main
 *
 * 运行：
 *   ./main
 * ============================================
 */

#include <stdio.h>

/*
 * 引入自定义头文件用双引号 ""。
 * 编译器先在当前目录搜索，再到系统路径搜索。
 */
#include "math_utils.h"

int main() {
    printf("===== 多文件编程示例 =====\n\n");

    // ========== 使用头文件中的函数 ==========
    printf("--- 基本运算 ---\n");
    printf("add(10, 5)      = %d\n", add(10, 5));
    printf("subtract(10, 5) = %d\n", subtract(10, 5));
    printf("multiply(10, 5) = %d\n", multiply(10, 5));
    printf("divide(10, 3)   = %d\n", divide(10, 3));
    printf("factorial(5)    = %d\n", factorial(5));

    // ========== 使用内联函数 ==========
    printf("\n--- 内联函数（定义在头文件中） ---\n");
    printf("square(12)      = %d\n", square(12));

    // ========== 使用宏 ==========
    printf("\n--- 宏 ---\n");
    printf("CUBE(3)         = %d\n", CUBE(3));
    printf("ABS(-10)        = %d\n", ABS(-10));

    // ========== 使用自定义类型 ==========
    printf("\n--- 自定义类型 ---\n");
    Vector2D v1 = {3, 4};
    Vector2D v2 = {1, 2};
    Vector2D v3 = vector_add(v1, v2);

    printf("v1 = (%d, %d)\n", v1.x, v1.y);
    printf("v2 = (%d, %d)\n", v2.x, v2.y);
    printf("v3 = v1 + v2 = (%d, %d)\n", v3.x, v3.y);

    // ========== 外部变量声明 ==========
    printf("\n===== 多文件编程总结 =====\n");

    printf("文件组织:\n");
    printf("  math_utils.h  — 函数声明、宏、类型定义\n");
    printf("  math_utils.c  — 函数实现\n");
    printf("  main.c        — 程序入口，使用函数\n");

    printf("\n编译命令:\n");
    printf("  gcc *.c -o main\n");

    printf("\n好处:\n");
    printf("  1. 模块化：功能分离\n");
    printf("  2. 复用性：头文件可被多个源文件包含\n");
    printf("  3. 编译效率：修改一个文件只需重新编译它\n");
    printf("  4. 封装：.h 公开接口，.c 隐藏实现\n");

    return 0;
}
