/*
 * ============================================
 * 知识点：可变参数函数
 * 说明：
 *   可变参数函数可以接收不定数量的参数。
 *   使用 <stdarg.h> 中的宏来操作：
 *   va_list   — 参数列表类型
 *   va_start  — 初始化参数列表
 *   va_arg    — 获取下一个参数
 *   va_end    — 清理参数列表
 *   va_copy   — 复制参数列表
 *
 *   注意：可变参数没有类型检查，需要
 *   通过其他方式确定参数类型和数量。
 *
 * 编译方法：
 *   gcc 01_variadic_functions.c -o 01_variadic_functions
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <stdarg.h>  // 可变参数支持

// ========== 方式1：数量由第一个参数指定 ==========
/*
 * 计算 n 个整数的和
 * 参数：count — 要计算的整数个数
 *       ...   — 可变参数
 */
int sum(int count, ...) {
    va_list args;         // 声明参数列表
    int total = 0;

    va_start(args, count);  // 初始化，count 是最后一个命名参数

    for (int i = 0; i < count; i++) {
        int value = va_arg(args, int);  // 获取下一个 int 参数
        total += value;
    }

    va_end(args);  // 清理

    return total;
}

// ========== 方式2：通过格式字符串确定类型 ==========
/*
 * 类似 printf 的自定义函数
 * 格式：'i'=int, 'f'=double, 's'=const char*
 */
void my_print(const char *fmt, ...) {
    va_list args;
    va_start(args, fmt);

    for (const char *p = fmt; *p != '\0'; p++) {
        switch (*p) {
            case 'i': {
                int val = va_arg(args, int);
                printf("%d ", val);
                break;
            }
            case 'f': {
                double val = va_arg(args, double);
                // 注意：float 在可变参数中会被提升为 double
                printf("%.2f ", val);
                break;
            }
            case 's': {
                const char *val = va_arg(args, const char*);
                printf("\"%s\" ", val);
                break;
            }
            case 'c': {
                char val = va_arg(args, int);
                // char 在可变参数中会被提升为 int
                printf("'%c' ", val);
                break;
            }
            default:
                printf("%c", *p);  // 普通字符原样输出
        }
    }
    printf("\n");

    va_end(args);
}

// ========== 方式3：带结束标记 ==========
/*
 * 计算平均值，参数以 -1 作为结束标记
 */
double average(int first, ...) {
    va_list args;
    int count = 1;
    int sum = first;

    va_start(args, first);

    while (1) {
        int value = va_arg(args, int);
        if (value == -1) break;  // 遇到结束标记
        sum += value;
        count++;
    }

    va_end(args);

    return (double)sum / count;
}

// ========== 遍历参数列表两次（使用 va_copy） ==========
void print_and_sum(const char *label, int count, ...) {
    va_list args;
    va_start(args, count);

    // 第一次遍历：计算总和
    va_list args_copy;
    va_copy(args_copy, args);  // 复制参数列表

    int sum = 0;
    for (int i = 0; i < count; i++) {
        sum += va_arg(args_copy, int);
    }
    va_end(args_copy);  // 复制品也要清理

    // 第二次遍历：打印每个值
    printf("%s: ", label);
    for (int i = 0; i < count; i++) {
        printf("%d ", va_arg(args, int));
    }
    printf("| 总和 = %d\n", sum);

    va_end(args);
}

// ========== 简单版本的 printf ==========
void my_printf(const char *format, ...) {
    va_list args;
    va_start(args, format);

    // 直接使用 vprintf
    vprintf(format, args);

    va_end(args);
}

// ========== 格式化到字符串（类似 sprintf） ==========
int my_sprintf(char *buffer, size_t size, const char *fmt, ...) {
    va_list args;
    va_start(args, fmt);
    int result = vsnprintf(buffer, size, fmt, args);
    va_end(args);
    return result;
}

// ========== 可变参数的约束 ==========
/*
 * 1. 至少需要一个命名参数（...之前至少一个参数）
 * 2. 可变参数没有类型检查
 * 3. float 被提升为 double
 * 4. char/short 被提升为 int
 */

int main() {
    // ========== sum 示例 ==========
    printf("===== sum (参数个数指定) =====\n");
    printf("sum(3, 10, 20, 30)           = %d\n", sum(3, 10, 20, 30));
    printf("sum(5, 1, 2, 3, 4, 5)        = %d\n",
           sum(5, 1, 2, 3, 4, 5));
    printf("sum(7, 1, 2, 3, 4, 5, 6, 7) = %d\n",
           sum(7, 1, 2, 3, 4, 5, 6, 7));

    // ========== my_print 示例 ==========
    printf("\n===== my_print (格式字符串) =====\n");
    my_print("i", 42);
    my_print("iifs", 10, 20, 3.14, "hello");
    my_print("icsf", 100, 'A', "world", 2.718);

    // ========== average 示例 ==========
    printf("\n===== average (结束标记) =====\n");
    printf("average(10, 20, 30, -1)    = %.2f\n",
           average(10, 20, 30, -1));
    printf("average(1, 2, 3, 4, 5, -1) = %.2f\n",
           average(1, 2, 3, 4, 5, -1));

    // ========== va_copy 示例 ==========
    printf("\n===== va_copy (两次遍历) =====\n");
    print_and_sum("数值", 5, 1, 2, 3, 4, 5);

    // ========== my_printf 示例 ==========
    printf("\n===== my_printf =====\n");
    my_printf("Hello, %s! The answer is %d.\n", "World", 42);

    // ========== my_sprintf 示例 ==========
    printf("\n===== my_sprintf =====\n");
    char buffer[100];
    int chars = my_sprintf(buffer, sizeof(buffer),
                          "结果: %d + %d = %d", 10, 20, 30);
    printf("格式化结果: \"%s\" (%d 字符)\n", buffer, chars);

    // ========== 最小值计算 ==========
    printf("\n===== 实际应用：min_of =====\n");

    int min_of(int count, ...) {
        va_list args;
        va_start(args, count);

        int min = va_arg(args, int);
        for (int i = 1; i < count; i++) {
            int val = va_arg(args, int);
            if (val < min) min = val;
        }

        va_end(args);
        return min;
    }

    printf("min_of(3, 10, 5, 20)      = %d\n",
           min_of(3, 10, 5, 20));
    printf("min_of(5, 9, 2, 7, 1, 8) = %d\n",
           min_of(5, 9, 2, 7, 1, 8));

    // ========== 注意事项 ==========
    printf("\n===== 注意事项 =====\n");
    printf("1. 必须至少有一个命名参数\n");
    printf("2. float 提升为 double，用 va_arg(args, double)\n");
    printf("3. char/short 提升为 int\n");
    printf("4. 没有类型安全，错误使用会导致未定义行为\n");
    printf("5. 建议用 gcc -Wformat 检查格式字符串\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. <stdarg.h> 提供 va_list, va_start, va_arg, va_end
 * 2. 必须通过某种方式知道参数数量和类型
 * 3. 常用方式：count参数、格式字符串、结束标记
 * 4. va_copy 可以复制参数列表用于多次遍历
 * 5. float 提升为 double，char/short 提升为 int
 * 6. vprintf/vsnprintf 可以直接使用 va_list
 * ============================================
 */
