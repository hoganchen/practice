/**
 * ============================================================
 * 知识点: 变参函数 (Variadic Functions)
 * ============================================================
 *
 * 【编译指令】
 *   gcc 05_variadic_functions.c -o 05_variadic_functions.exe -std=c11 -Wall
 *
 * 【运行指令】
 *   ./05_variadic_functions.exe
 *
 * 【知识点概述】
 *   变参函数（variable argument functions）允许函数接受可变数量的参数。
 *   使用 <stdarg.h> 标准库提供的宏来访问参数列表：
 *     - va_list:    声明一个变量用于遍历参数列表
 *     - va_start:   初始化 va_list，指向第一个可变参数
 *     - va_arg:     获取当前参数的值，并使指针指向下一个参数
 *     - va_end:     清理工作，结束可变参数的获取
 *     - va_copy:    复制 va_list 的状态（C99 引入）
 *   经典应用：printf、scanf 等标准库函数。
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdarg.h>  // 变参函数所需的头文件

// =============================================================
// 函数声明
// =============================================================

/*
 * 计算 n 个整数的和（第一个参数指定个数）
 */
int sum(int count, ...);

/*
 * 计算 n 个整数的平均值
 */
double average(int count, ...);

/*
 * 查找 n 个整数中的最大值
 */
int max_of(int count, ...);

/*
 * 格式化输出变参（类似简易版 printf）
 */
void my_printf(const char* format, ...);

/*
 * 使用 va_copy 的演示：先计算总和，再分别打印每个值
 */
void print_and_sum(int count, ...);

/*
 * 接受不同类型的变参函数（使用格式化字符串指定类型）
 * 格式：%d 表示 int，%f 表示 double，%s 表示字符串
 */
void mixed_format(const char* types, ...);

/**
 * 主函数
 */
int main(void)
{
    printf("========================================\n");
    printf("  变参函数 (Variadic Functions) 示例\n");
    printf("========================================\n\n");

    // =========================================================
    // 第一部分: 基本变参函数
    // =========================================================
    printf("========================================\n");
    printf("  第一部分: 基本变参函数\n");
    printf("========================================\n\n");

    // ---------------------------------------------------------
    // 示例 1: 求和函数 —— 不同参数个数
    // ---------------------------------------------------------
    printf("【示例 1】求和函数（不同参数个数）\n");

    // 同一个函数可以接受不同数量的参数
    int s1 = sum(3, 10, 20, 30);          // 3 个参数
    int s2 = sum(5, 1, 2, 3, 4, 5);       // 5 个参数
    int s3 = sum(2, 100, 200);            // 2 个参数

    printf("  sum(3, 10, 20, 30)        = %d\n", s1);
    printf("  sum(5, 1, 2, 3, 4, 5)     = %d\n", s2);
    printf("  sum(2, 100, 200)          = %d\n", s3);
    printf("\n");

    // ---------------------------------------------------------
    // 示例 2: 平均值函数
    // ---------------------------------------------------------
    printf("【示例 2】平均值函数\n");

    double avg1 = average(3, 85.0, 90.0, 95.0);     // 3 门课的平均分
    double avg2 = average(5, 10.5, 20.5, 30.5, 40.5, 50.5);

    printf("  三门课的平均分: %.2f\n", avg1);
    printf("  五个数的平均值: %.2f\n", avg2);
    printf("\n");

    // ---------------------------------------------------------
    // 示例 3: 查找最大值
    // ---------------------------------------------------------
    printf("【示例 3】变参中的最大值\n");

    int m1 = max_of(5, 34, 78, 12, 90, 56);
    int m2 = max_of(3, 1000, 999, 1001);

    printf("  max_of(5, 34,78,12,90,56)   = %d\n", m1);
    printf("  max_of(3, 1000,999,1001)    = %d\n", m2);
    printf("\n");

    // =========================================================
    // 第二部分: 模拟 printf 格式控制
    // =========================================================
    printf("========================================\n");
    printf("  第二部分: 自定义格式化输出\n");
    printf("========================================\n\n");

    // ---------------------------------------------------------
    // 示例 4: 自定义简易 printf
    // ---------------------------------------------------------
    printf("【示例 4】自定义简易 my_printf\n");

    // 使用我们自己实现的 my_printf
    my_printf("  %d + %d = %d\n", 10, 20, 30);
    my_printf("  姓名: %s, 年龄: %d, 分数: %d\n", "张三", 18, 95);
    printf("\n");

    // =========================================================
    // 第三部分: va_copy 的使用
    // =========================================================
    printf("========================================\n");
    printf("  第三部分: va_copy —— 遍历可变参数列表多次\n");
    printf("========================================\n\n");

    // ---------------------------------------------------------
    // 示例 5: 使用 va_copy 同时打印和计算
    // ---------------------------------------------------------
    printf("【示例 5】va_copy —— 打印并求和\n");

    print_and_sum(4, 10, 20, 30, 40);
    printf("\n");

    // =========================================================
    // 第四部分: 混合类型变参函数
    // =========================================================
    printf("========================================\n");
    printf("  第四部分: 混合类型的变参函数\n");
    printf("========================================\n\n");

    // ---------------------------------------------------------
    // 示例 6: 根据格式字符串处理不同类型的参数
    // ---------------------------------------------------------
    printf("【示例 6】混合类型变参函数\n");

    // 格式字符串：%d 表示 int, %f 表示 double, %s 表示字符串
    mixed_format("dsd", 42, 3.14159, "Hello, World!");
    mixed_format("dds", 100, 200, 99.9, "Done");
    printf("\n");

    // =========================================================
    // 第五部分: 注意事项和限制
    // =========================================================
    printf("========================================\n");
    printf("  第五部分: 注意事项和限制\n");
    printf("========================================\n\n");

    /*
     * 变参函数的重要限制：
     *
     * 1. 至少需要一个固定参数来启动 va_start
     *    例如：void func(int count, ...) 中的 count
     *
     * 2. 无法知道可变参数的个数 —— 必须由调用者告知
     *    方式包括：
     *      - 第一个参数指定个数（如 sum 的 count）
     *      - 终止标记（如 -1 或 NULL）
     *      - 格式字符串（如 printf 的 format）
     *
     * 3. 无法知道每个参数的类型 —— 默认参数提升规则：
     *      - char -> int
     *      - short -> int
     *      - float -> double
     *    所以 va_arg(args, double) 而不是 float
     *
     * 4. 没有类型安全检查 —— 编译器无法检查变参部分的类型
     *    这是 printf 常见 bug 的根源
     */

    printf("  变参函数的限制总结:\n\n");
    printf("  1. 至少需要一个固定参数\n");
    printf("  2. 必须通过某种方式告知参数的个数\n");
    printf("  3. 类型不安全 —— 编译器不检查变参类型\n");
    printf("  4. 默认参数提升: char/short -> int, float -> double\n");
    printf("\n");

    printf("========================================\n");
    printf("  变参函数要点总结:\n\n");
    printf("  必需的宏:\n");
    printf("    va_list ap;     - 声明变量\n");
    printf("    va_start(ap, n) - 初始化，n 是最后一个固定参数\n");
    printf("    va_arg(ap, T)   - 获取参数，T 是期望的类型\n");
    printf("    va_end(ap)      - 清理\n");
    printf("    va_copy(dst, src) - 复制（用于多次遍历）\n\n");
    printf("  应用场景:\n");
    printf("    日志系统、格式化输出、数值计算、错误报告\n");
    printf("========================================\n");

    return 0;
}

// =============================================================
// 函数实现
// =============================================================

/**
 * sum - 计算 n 个整数的和
 * @count: 要计算的整数个数（固定参数）
 * @...:    可变参数，count 个整数
 *
 * 变参函数必须至少有一个固定参数，va_start 使用它来定位可变参数。
 *
 * 返回: 所有参数的和
 */
int sum(int count, ...)
{
    int total = 0;

    // 1. 声明 va_list 变量，用于遍历可变参数
    va_list args;

    // 2. 初始化 va_list，指向第一个可变参数
    // va_start 的第二个参数是最后一个固定参数（即 count）
    va_start(args, count);

    // 3. 循环获取每个可变参数
    for (int i = 0; i < count; i++) {
        // va_arg 获取当前参数的值，并自动指向下一个参数
        // 第二个参数是期望的类型（这里所有参数都是 int）
        int value = va_arg(args, int);
        total += value;
    }

    // 4. 清理 va_list
    va_end(args);

    return total;
}

/**
 * average - 计算 n 个浮点数的平均值
 * @count: 数字个数
 * @...:    double 类型的可变参数
 *
 * 返回: 平均值
 *
 * 注意：由于默认参数提升，float 类型的参数会自动提升为 double，
 * 所以 va_arg 要写 double 而不是 float！
 */
double average(int count, ...)
{
    double sum = 0.0;

    va_list args;
    va_start(args, count);

    for (int i = 0; i < count; i++) {
        // 参数类型是 double（传入 float 也会被提升为 double）
        double value = va_arg(args, double);
        sum += value;
    }

    va_end(args);

    return sum / count;
}

/**
 * max_of - 在 n 个整数中查找最大值
 * @count: 整数个数
 * @...:    整数列表
 *
 * 返回: 最大值
 */
int max_of(int count, ...)
{
    va_list args;
    va_start(args, count);

    // 第一个参数作为初始最大值
    int max = va_arg(args, int);

    // 遍历剩余参数，更新最大值
    for (int i = 1; i < count; i++) {
        int value = va_arg(args, int);
        if (value > max) {
            max = value;
        }
    }

    va_end(args);

    return max;
}

/**
 * my_printf - 简易的自定义 printf
 * @format: 格式字符串，支持 %d（整数）和 %s（字符串）
 * @...:    变参列表
 *
 * 这个函数演示了如何根据格式字符串解析变参。
 * 这是一个极度简化的版本，仅用于演示变参的使用方法。
 */
void my_printf(const char* format, ...)
{
    va_list args;
    va_start(args, format);

    // 遍历格式字符串
    for (const char* p = format; *p != '\0'; p++) {
        if (*p == '%') {
            // 遇到 %，获取下一个字符判断格式
            p++;  // 跳过 %
            switch (*p) {
                case 'd': {
                    // %d: 整数
                    int value = va_arg(args, int);
                    printf("%d", value);
                    break;
                }
                case 's': {
                    // %s: 字符串
                    const char* value = va_arg(args, const char*);
                    printf("%s", value);
                    break;
                }
                case '%': {
                    // %%: 输出百分号本身
                    putchar('%');
                    break;
                }
                default:
                    // 不认识的格式，原样输出
                    putchar('%');
                    putchar(*p);
                    break;
            }
        } else {
            // 普通字符，直接输出
            putchar(*p);
        }
    }

    va_end(args);
}

/**
 * print_and_sum - 使用 va_copy 遍历可变参数两次
 * @count: 参数个数
 * @...:    整数列表
 *
 * 演示 va_copy 的用法：
 * 第一次遍历：计算总和
 * 第二次遍历：打印每个值
 * 如果不使用 va_copy，第一次遍历后 args 就到达了末尾，无法再次遍历。
 */
void print_and_sum(int count, ...)
{
    va_list args;
    va_start(args, count);

    // 复制 va_list，用于第二次遍历
    va_list args_copy;
    va_copy(args_copy, args);

    // 第一次遍历：计算总和
    int total = 0;
    for (int i = 0; i < count; i++) {
        int value = va_arg(args, int);
        total += value;
    }

    // args 已经用完，必须用 va_end 关闭
    va_end(args);

    // 第二次遍历：使用 args_copy 打印每个值
    // va_copy 让 args_copy 指向 args 的原始位置
    printf("  参数: ");
    for (int i = 0; i < count; i++) {
        int value = va_arg(args_copy, int);
        printf("%d ", value);
    }
    printf("\n");

    // 总和: 使用第一次遍历的结果
    printf("  总和: %d\n", total);

    // 清理 args_copy
    va_end(args_copy);
}

/**
 * mixed_format - 处理混合类型的变参
 * @types: 格式字符串，每个字符指定一个参数的类型
 *         'd' = int, 'f' = double, 's' = const char*
 * @...:    变参列表
 *
 * 演示如何根据类型信息获取不同类型的参数。
 */
void mixed_format(const char* types, ...)
{
    va_list args;
    va_start(args, types);

    printf("  混合参数输出: ");

    // 遍历格式字符串
    for (const char* p = types; *p != '\0'; p++) {
        switch (*p) {
            case 'd': {
                // int 类型
                int value = va_arg(args, int);
                printf("[整数: %d] ", value);
                break;
            }
            case 'f': {
                // double 类型（注意：float 会被提升为 double）
                double value = va_arg(args, double);
                printf("[浮点: %.2f] ", value);
                break;
            }
            case 's': {
                // 字符串类型
                const char* value = va_arg(args, const char*);
                printf("[字符串: \"%s\"] ", value);
                break;
            }
            default:
                printf("[未知类型: %c] ", *p);
                break;
        }
    }
    printf("\n");

    va_end(args);
}
