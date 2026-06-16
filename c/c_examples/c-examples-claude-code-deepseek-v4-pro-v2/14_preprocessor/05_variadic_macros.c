/**
 * ============================================================================
 * 知识要点: 可变参数宏 (Variadic Macros) — C99 引入
 * ============================================================================
 *
 * 编译指令: gcc 05_variadic_macros.c -o 05_variadic_macros.exe -std=c11 -Wall
 * 运行指令: ./05_variadic_macros.exe
 *
 * 知识点概述:
 *   可变参数宏允许宏定义接受不定数量的参数。
 *   核心语法:
 *     #define DEBUG(fmt, ...) printf(fmt, __VA_ARGS__)
 *   其中 ... 表示可变参数，__VA_ARGS__ 在宏展开时代入实际的参数列表。
 *
 * 扩展技巧:
 *   - ##__VA_ARGS__ : GNU/GCC 扩展（也被 MSVC 支持），当可变参数为空时删除前导逗号
 *   - __VA_OPT__    : C23 标准方式，条件性地包含 __VA_OPT__(content)
 *                     仅在可变参数非空时才展开
 *
 * 注意事项:
 *   - 可变参数宏至少需要一个命名参数（在 ... 之前）
 *   - __VA_ARGS__ 可以包含逗号（如函数调用），宏会正确处理
 *   - ##__VA_ARGS__ 只能与前面的逗号配合使用
 * ============================================================================
 */

#include "../common/charset.h"
#include <stdio.h>   /* printf, fprintf */
#include <stdlib.h>  /* exit */
#include <assert.h>  /* assert (用于对比) */
#include <time.h>    /* time, localtime, strftime */

/* ============================================================================
 * 示例 1: 基础可变参数宏 — 调试输出宏
 *
 * 最基础的用法：直接透传 printf 风格的参数
 *
 * 注意: 如果 ... 是空的，展开后会出现 printf(fmt, ) 尾逗号语法错误
 *       下面会演示如何使用 ##__VA_ARGS__ 解决这个问题
 * ============================================================================
 */

/* 基础版本 — 如果可变参数为空会导致编译器报错 */
#define DEBUG_BASIC(fmt, ...) printf("[DEBUG] " fmt "\n", __VA_ARGS__)

/* 改进版本 — 使用 ##__VA_ARGS__ (GNU 扩展)
 * 当 ... 为空时，## 会删除前面的逗号
 * 即: DEBUG("hello")          展开为 printf("[DEBUG] " "hello" "\n")
 *     DEBUG("val=%d", 42)    展开为 printf("[DEBUG] " "val=%d" "\n", 42)
 */
#define DEBUG(fmt, ...) printf("[DEBUG] " fmt "\n", ##__VA_ARGS__)

/* ============================================================================
 * 示例 2: 带时间戳的日志宏
 *
 * 在调试输出前加上当前时间
 * ============================================================================
 */

/* 获取当前时间字符串（线程不安全但简单演示用）*/
static const char* current_timestamp(void)
{
    static char buf[32];
    time_t now = time(NULL);
    struct tm *tm_info = localtime(&now);
    strftime(buf, sizeof(buf), "%H:%M:%S", tm_info);
    return buf;
}

/* 带时间戳的日志宏 */
#define LOG(fmt, ...) \
    printf("[%s] " fmt "\n", current_timestamp(), ##__VA_ARGS__)

/* ============================================================================
 * 示例 3: 带文件和行号信息的断言宏
 *
 * 类似标准 assert，但可以附带自定义错误消息
 *
 * 关键技巧: 自动检测是否提供了额外消息
 *   sizeof(#__VA_ARGS__) > 1
 *   将可变参数通过 # 字符串化:
 *     空参数 → ""            (sizeof == 1)
 *     有参数 → "\"fmt\",…"   (sizeof > 1)
 *
 *   当需要将可变参数传给 fprintf 时，使用尾巴参数 ""：
 *     fprintf(stderr, ##__VA_ARGS__, "");
 *     空参数 → fprintf(stderr, "")         (有效)
 *     有参数 → fprintf(stderr, "fmt", a…)  ("" 被忽略)
 * ============================================================================
 */

/* 带消息的自定义断言宏
 * 当条件 expr 为假时，打印失败信息并退出程序
 *
 * 使用 do { ... } while(0) 惯用法，确保宏在 if/else 中安全使用
 */
#define ASSERT_MSG(expr, ...)                                                  \
    do {                                                                       \
        if (!(expr)) {                                                         \
            fprintf(stderr, "断言失败: %s\n", #expr);                         \
            fprintf(stderr, "  文件: %s\n", __FILE__);                        \
            fprintf(stderr, "  行号: %d\n", __LINE__);                        \
            /* 判断是否有额外的错误消息 */                                      \
            if (sizeof(#__VA_ARGS__) > 1) {                                   \
                fprintf(stderr, "  消息: ");                                   \
                /* 尾巴参数 "": 空时作为 fprintf 的格式串，非空时被忽略 */      \
                fprintf(stderr, ##__VA_ARGS__, "");                            \
                fprintf(stderr, "\n");                                         \
            }                                                                  \
            exit(EXIT_FAILURE);                                                \
        }                                                                      \
    } while(0)

/* 简化断言宏: 只警告，不退出
 * 同样支持条件性消息打印 */
#define ASSERT_WARN(expr, ...)                                                 \
    do {                                                                       \
        if (!(expr)) {                                                         \
            fprintf(stderr, "警告: %s 失败", #expr);                          \
            fprintf(stderr, " @ %s:%d", __FILE__, __LINE__);                  \
            /* 检测是否有额外消息 */                                            \
            if (sizeof(#__VA_ARGS__) > 1) {                                   \
                fprintf(stderr, " — ");                                        \
                /* 尾巴参数 "" 技巧: 保证空参数时 fprintf 依然合法 */           \
                fprintf(stderr, ##__VA_ARGS__, "");                            \
            }                                                                  \
            fprintf(stderr, "\n");                                             \
        }                                                                      \
    } while(0)

/* ============================================================================
 * 示例 4: 跟踪进入和退出函数的宏
 *
 * 使用可变参数宏实现简单的函数调用跟踪
 * ============================================================================
 */

/* 静态缩进级别（不完美但足以演示）*/
static int trace_indent = 0;

#define TRACE_ENTER(fmt, ...)                                                  \
    do {                                                                       \
        for (int _i = 0; _i < trace_indent; _i++) printf("  ");               \
        printf("--> " fmt "\n", ##__VA_ARGS__);                               \
        trace_indent++;                                                        \
    } while(0)

#define TRACE_EXIT(fmt, ...)                                                   \
    do {                                                                       \
        trace_indent--;                                                        \
        if (trace_indent < 0) trace_indent = 0;                               \
        for (int _i = 0; _i < trace_indent; _i++) printf("  ");               \
        printf("<-- " fmt "\n", ##__VA_ARGS__);                               \
    } while(0)

/* ============================================================================
 * 示例 5: 错误处理宏 — 如果错误就返回
 *
 * 封装常见的 "检查错误并返回" 模式
 * ============================================================================
 */

/* 报告错误并返回指定值 */
#define RETURN_IF_ERROR(expr, retval, ...)                                     \
    do {                                                                       \
        if ((expr)) {                                                          \
            fprintf(stderr, "错误: %s\n", #expr);                             \
            fprintf(stderr, "  位置: %s:%d\n", __FILE__, __LINE__);          \
            if (sizeof(#__VA_ARGS__) > 1) {                                   \
                fprintf(stderr, "  详情: ");                                   \
                fprintf(stderr, ##__VA_ARGS__, "");                            \
                fprintf(stderr, "\n");                                         \
            }                                                                  \
            return retval;                                                     \
        }                                                                      \
    } while(0)

/* ============================================================================
 * 示例 6: 打印数组内容的通用宏
 *
 * 通过可变参数支持不同的打印格式
 * PRING_ARRAY(arr, count, fmt, ...)
 *   fmt 是 printf 格式串，... 是额外格式参数（如精度等）
 * ============================================================================
 */

#define PRINT_ARRAY(arr, count, fmt, ...)                                      \
    do {                                                                       \
        printf("数组 %s (%zu 个元素): [", #arr, (size_t)(count));             \
        for (size_t _i = 0; _i < (size_t)(count); _i++) {                     \
            printf(fmt, (arr)[_i], ##__VA_ARGS__);                             \
            if (_i < (size_t)(count) - 1) printf(", ");                       \
        }                                                                      \
        printf("]\n");                                                         \
    } while(0)

/* ============================================================================
 * 示例 7: type-generic 的 MAX 宏
 *
 * 简单的宏实现多参数最大值
 * ============================================================================
 */

#define MAX2(a, b) ((a) > (b) ? (a) : (b))

/* 三个参数中的最大值 */
#define MAX_OF_3(a, b, c) MAX2(MAX2((a), (b)), (c))

/* ============================================================================
 * 测试函数: 模拟一个有嵌套调用的函数
 * ============================================================================
 */

void inner_function(int value)
{
    TRACE_ENTER("inner_function(value=%d)", value);

    /* 一些处理... */
    LOG("处理值 %d", value);
    LOG("完成");

    TRACE_EXIT("inner_function(value=%d)", value);
}

void outer_function(const char *name, int count)
{
    TRACE_ENTER("outer_function(name=%s, count=%d)", name, count);

    for (int i = 0; i < count; i++) {
        inner_function(i * 10);
    }

    TRACE_EXIT("outer_function(name=%s, count=%d)", name, count);
}

/* ============================================================================
 * 测试函数: 尝试可能失败的操作（演示 RETURN_IF_ERROR）
 * ============================================================================
 */

/* 模拟一个可能失败的操作 */
static int simulate_operation(int should_fail)
{
    if (should_fail) {
        return -1;  /* 返回错误码 */
    }
    return 0;  /* 成功 */
}

int process_data(int data[], size_t count)
{
    /* 演示 RETURN_IF_ERROR 的使用 */
    int ret = simulate_operation(count > 10);
    RETURN_IF_ERROR(ret != 0, -1,
                    "count=%zu 超过限制", count);

    printf("处理 %zu 个数据元素: ", count);
    for (size_t i = 0; i < count; i++) {
        printf("%d ", data[i]);
    }
    printf("\n");
    return 0;
}

/* ============================================================================
 * 主函数
 * ============================================================================
 */
int main(void)
{
    printf("============================================\n");
    printf("  可变参数宏 (Variadic Macros) 示例\n");
    printf("============================================\n");

    /* ----------------------------------------------------------------
     * 示例 1: 基础 DEBUG 宏
     * ---------------------------------------------------------------- */
    printf("\n====== 示例 1: 基础 DEBUG 宏 ======\n");

    DEBUG("这是一个简单的调试消息");
    DEBUG("带参数的调试消息: value=%d, name=%s", 42, "Alice");
    DEBUG("空可变参数也能正常工作");  /* 靠 ##__VA_ARGS__ 删除逗号 */

    /* 对比: 用 DEBUG_BASIC 不带额外参数会编译错误 */
    /* DEBUG_BASIC("hello"); */  /* 这行会报错 — 展开为 printf("fmt\n", ) */

    /* ----------------------------------------------------------------
     * 示例 2: 带时间戳的日志宏
     * ---------------------------------------------------------------- */
    printf("\n====== 示例 2: 带时间戳的 LOG 宏 ======\n");

    LOG("程序启动");
    LOG("当前用户: %s", "root");
    LOG("执行任务 ID: %d", 1001);
    LOG("完成");

    /* ----------------------------------------------------------------
     * 示例 3: 自定义断言宏
     * ---------------------------------------------------------------- */
    printf("\n====== 示例 3: 自定义断言宏 ======\n");

    int x = 10;
    int y = 20;

    /* 带消息的警告 — 通过 sizeof(#__VA_ARGS__) 检测到有额外消息 */
    ASSERT_WARN(x == y, "x(%d) 应该等于 y(%d)", x, y);
    /* 无消息的警告 — 仅打印文件行号（条件为假，不会触发）*/
    ASSERT_WARN(x < y);

    printf("断言测试通过 (x=%d, y=%d)\n", x, y);

    /* 取消注释下面一行来测试 ASSERT_MSG 失败（会退出程序）*/
    /* ASSERT_MSG(x > y, "x=%d 不大于 y=%d", x, y); */

    /* ----------------------------------------------------------------
     * 示例 4: 函数跟踪宏
     * ---------------------------------------------------------------- */
    printf("\n====== 示例 4: 函数跟踪宏 ======\n");

    outer_function("test", 3);

    /* ----------------------------------------------------------------
     * 示例 5: RETURN_IF_ERROR
     * ---------------------------------------------------------------- */
    printf("\n====== 示例 5: RETURN_IF_ERROR ======\n");

    int data_ok[] = {1, 2, 3, 4, 5};
    int result1 = process_data(data_ok, 5);
    printf("process_data(5 个元素) 返回: %d\n\n", result1);

    int data_big[] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11};
    int result2 = process_data(data_big, 11);
    printf("process_data(11 个元素) 返回: %d\n", result2);
    /* 注意: 这里返回了 -1，但程序继续运行，因为 RETURN_IF_ERROR 用 return 而不是 exit */

    /* ----------------------------------------------------------------
     * 示例 6: PRINT_ARRAY 宏
     * ---------------------------------------------------------------- */
    printf("\n====== 示例 6: PRINT_ARRAY 宏 ======\n");

    double doubles[] = {1.1, 2.2, 3.3, 4.4};
    PRINT_ARRAY(doubles, 4, "%.1f");

    int ints[] = {10, 20, 30, 40, 50};
    PRINT_ARRAY(ints, 5, "%d");

    /* ----------------------------------------------------------------
     * 示例 7: MAX_OF_3 宏
     * ---------------------------------------------------------------- */
    printf("\n====== 示例 7: MAX 宏 ======\n");

    int mx = MAX_OF_3(10, 20, 15);
    printf("MAX_OF_3(10, 20, 15) = %d\n", mx);

    double dmx = MAX_OF_3(3.14, 2.718, 1.618);
    printf("MAX_OF_3(3.14, 2.718, 1.618) = %.3f\n", dmx);

    printf("\n============================================\n");
    printf("  程序运行完毕\n");
    printf("============================================\n");

    return 0;
}

/* ============================================================================
 * 最佳实践总结:
 *
 * 1. 始终使用 ##__VA_ARGS__ 扩展 (GNU/MSVC 支持)
 *    避免可变参数为空时产生尾逗号导致编译错误。
 *
 * 2. 检测可变参数是否为空的技巧:
 *    sizeof(#__VA_ARGS__) > 1
 *    #__VA_ARGS__ 将参数字符串化:
 *      空参数 → ""  (sizeof = 1)
 *      有参数 → "\"fmt\", args"  (sizeof > 1)
 *    注意: 这是编译期常量，编译器会优化掉无用分支。
 *
 * 3. 尾巴参数 "" 技巧:
 *    fprintf(stderr, ##__VA_ARGS__, "");
 *      空参数 → fprintf(stderr, "")         有效，打印空串
 *      有参数 → fprintf(stderr, "fmt", …)   "" 被忽略（C 允许）
 *
 * 4. 使用 do { ... } while(0) 惯用法包裹多语句宏
 *    确保宏在 if/else、for 等语句中能正确工作
 *
 * 5. 结合预定义宏 __FILE__, __LINE__, __func__, __DATE__, __TIME__
 *    让调试输出信息更丰富
 *
 * 6. 宏参数用括号保护
 *    例如 #define SQUARE(x) ((x)*(x)) 中括号是必要的
 *
 * 7. C23 的 __VA_OPT__ 是标准化方案
 *    如需最大兼容性，用 ##__VA_ARGS__；如需 C23 标准，用 __VA_OPT__
 *
 * 8. 不要过度使用宏
 *    复杂逻辑应使用函数或内联函数，宏只用于简单的文本替换场景
 * ============================================================================
 */
