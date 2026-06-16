/**
 * ============================================================
 * 知识点: 内联函数 (Inline Functions) - C99/C11
 *
 * inline 关键字是对编译器的"请求"(而非命令),建议将函数调用
 * 替换为函数体代码,以减少函数调用开销(栈帧创建/销毁等)。
 *
 * inline 的几种形式:
 *   static inline - 内部链接,最常用,最安全
 *   inline        - 外部链接(需要另一个编译单元提供定义)
 *   extern inline - 外部定义,用于提供函数的"外部定义"
 *
 * 与宏(#define)对比:
 *   - 类型安全: inline 函数有参数类型检查
 *   - 无副作用: 参数只求值一次(宏可能多次求值)
 *   - 可调试: 有函数名,可设断点
 *   - 作用域: 遵守作用域规则
 *
 * 编译指令:
 *   gcc 06_inline_functions.c -o 06_inline_functions.exe -std=c11 -Wall
 * 运行:
 *   ./06_inline_functions.exe
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>  /* 用于 abs 比较 */

/* ======== 1. static inline 函数 ======== */
/*
 * static inline: 最常用的内联形式。
 * - static 表示内部链接,只在当前编译单元可见
 * - inline 建议编译器内联展开
 * - 不会产生外部符号,避免链接冲突
 */

/**
 * 计算两个整数中的最大值(取代宏 MAX(a,b))
 * 优点: 类型安全,参数只求值一次
 */
static inline int max_int(int a, int b)
{
    return a > b ? a : b;
}

/**
 * 计算两个整数的平方和
 * static inline 适合小型、频繁调用的工具函数
 */
static inline int square_sum(int x, int y)
{
    return x * x + y * y;
}

/**
 * 将华氏温度转换为摄氏温度
 * 浮点运算也适合内联,减少函数调用开销
 */
static inline double fahrenheit_to_celsius(double f)
{
    return (f - 32.0) * 5.0 / 9.0;
}

/* ======== 2. 宏定义的对比(展示宏的问题) ======== */
/*
 * 注意: 以下两个宏存在典型问题:
 */
#define MAX(a, b)     ((a) > (b) ? (a) : (b))
#define SQUARE_SUM(x, y) ((x)*(x) + (y)*(y))

/* ========== 3. 声明一个普通 inline 函数(外部链接) ========== */
/*
 * 不带 static 的 inline 函数具有外部链接。
 * 如果编译器决定不内联,会期望在其他编译单元找到该函数的定义。
 * 通常在头文件中声明 inline,在某个 .c 文件中提供 extern inline 定义。
 *
 * 注意: 在单文件示例中,如果不加 static,需要同时提供 extern inline
 * 定义才能通过链接。这里我们统一使用 static inline 以保证单文件
 * 示例的简洁性。
 */

/* 函数的声明(通常在头文件中) */
static inline int clamp(int value, int min, int max);

/* ========== 4. 函数指针和内联 ========== */
/*
 * 注意: 当内联函数的地址被取用时(赋值给函数指针),
 * 编译器必须生成该函数的非内联版本。
 */
static inline int triple(int x)
{
    return x * 3;
}

int main(void)
{
    printf("========================================\n");
    printf("  内联函数 (Inline Functions) 演示\n");
    printf("========================================\n\n");

    /* ======== 演示 static inline 函数 ======== */
    printf("======== 1. static inline 基本用法 ========\n");

    int x = 10, y = 20;
    printf("max_int(%d, %d) = %d\n", x, y, max_int(x, y));
    printf("square_sum(%d, %d) = %d\n", x, y, square_sum(x, y));

    double temp_f = 98.6;
    double temp_c = fahrenheit_to_celsius(temp_f);
    printf("%.1f°F = %.1f°C\n\n", temp_f, temp_c);

    /* ======== 演示 inline + 外部定义 ======== */
    printf("======== 2. inline 函数(外部链接) ========\n");
    printf("clamp(%d, %d, %d) = %d\n\n", 150, 0, 100, clamp(150, 0, 100));

    /* ======== 对比: 内联函数 vs 宏 ======== */
    printf("======== 3. 内联函数 vs 宏 ========\n");

    /*
     * 宏的典型问题: 参数副作用(多次求值)
     *
     * 下面的宏 MAX(i++, j++) 会展开为:
     *   ((i++) > (j++) ? (i++) : (j++))
     * 这将导致 i 或 j 自增两次!
     */
    int i = 5, j = 10;
    int macro_result = MAX(i++, j++);
    printf("--- 宏的参数副作用问题 ---\n");
    printf("MAX(i++, j++):\n");
    printf("  结果 = %d, i = %d (期望6), j = %d (期望11?)\n",
           macro_result, i, j);
    printf("  问题: i或j被多次求值!\n\n");

    /* 内联函数: 参数只求值一次 */
    int m = 5, n = 10;
    int inline_result = max_int(m++, n++);
    printf("--- 内联函数无副作用 ---\n");
    printf("max_int(m++, n++):\n");
    printf("  结果 = %d, m = %d, n = %d (各自增一次)\n\n",
           inline_result, m, n);

    /*
     * 另一个宏问题: 类型不安全
     * MAX(3.14, 2.71) 可以工作,但返回 double 赋值给 int 会有截断警告
     * SQUARE_SUM(3.5, 2.5) 会得到 (3.5*3.5 + 2.5*2.5) = 12.25+6.25 = 18.5
     * 但宏期望的是整数运算
     */
    printf("--- 宏的类型安全问题 ---\n");
    printf("SQUARE_SUM(3.5, 2.5) = %.2f (浮点数结果,但宏参数无类型检查)\n",
           (double)SQUARE_SUM(3.5, 2.5));
    printf("square_sum(3.5, 2.5) = 编译错误! (类型安全检查,不能传浮点数给int参数)\n\n");

    /* ======== 函数指针与内联 ======== */
    printf("======== 4. 函数指针与内联 ========\n");
    /*
     * 将内联函数的地址赋给函数指针。
     * 这会"阻止"内联: 编译器必须生成非内联版本以便通过指针调用。
     */
    int (*func_ptr)(int) = triple;  /* 取地址,强制生成非内联版本 */
    int arr[] = {1, 2, 3, 4, 5};
    printf("通过函数指针调用 triple:\n");
    for (size_t idx = 0; idx < sizeof(arr)/sizeof(arr[0]); idx++) {
        printf("  triple(%d) = %d", arr[idx], func_ptr(arr[idx]));
        if (idx == 0) {
            printf(" (通过指针调用,编译器必须生成函数体)\n");
        } else {
            printf("\n");
        }
    }
    printf("\n");
    printf("直接调用 triple(6) = %d (编译器可以内联)\n\n", triple(6));

    /* ======== 内联的使用建议 ======== */
    printf("======== 5. static inline 使用建议 ========\n");
    printf("适合内联的场景:\n");
    printf("  1. 小型、频繁调用的函数 (getter/setter)\n");
    printf("  2. 性能关键路径上的简单函数\n");
    printf("  3. 头文件中的工具函数\n");
    printf("\n不适合内联的场景:\n");
    printf("  1. 大型函数(会使代码膨胀,降低缓存命中率)\n");
    printf("  2. 递归函数(无法真正内联)\n");
    printf("  3. 带有静态变量的函数\n");
    printf("  4. 带有可变参数列表的函数\n");

    return 0;
}

/**
 * clamp 函数: 将 value 限制在 [min, max] 范围内
 * 使用 static inline: 单文件示例中最安全简单的形式
 * 不会产生外部符号,避免链接问题
 */
static inline int clamp(int value, int min, int max)
{
    if (value < min) return min;
    if (value > max) return max;
    return value;
}
