/*
 * ============================================
 * 知识点：预处理指令 — #define 宏
 * 说明：
 *   预处理在编译前处理，以 # 开头的指令。
 *   主要功能：
 *   1. 宏定义 (#define)
 *   2. 文件包含 (#include)
 *   3. 条件编译 (#if, #ifdef, #ifndef)
 *   4. 错误指令 (#error)
 *   5. 行控制 (#line)
 *   6. 编译指示 (#pragma)
 *
 *   预定义宏：
 *   __LINE__     — 当前行号
 *   __FILE__     — 当前文件名
 *   __DATE__     — 编译日期
 *   __TIME__     — 编译时间
 *   __STDC__     — 是否遵循C标准
 *
 * 编译方法：
 *   gcc 01_macros.c -o 01_macros
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"

// ========== 常量宏 ==========
#define MAX_BUFFER_SIZE 1024
#define PI 3.1415926535
#define APP_VERSION "1.0.0"
#define AUTHOR "C语言教程"

// ========== 函数式宏 ==========
// 注意：参数要加括号避免优先级问题
#define SQUARE(x)       ((x) * (x))
#define MAX(a, b)       ((a) > (b) ? (a) : (b))
#define MIN(a, b)       ((a) < (b) ? (a) : (b))
#define ABS(x)          ((x) < 0 ? -(x) : (x))
#define IS_EVEN(x)      ((x) % 2 == 0)

// ========== 多语句宏 ==========
#define SWAP(a, b, type) do { \
    type temp = a;            \
    a = b;                    \
    b = temp;                 \
} while (0)

// ========== 字符串化运算符 # ==========
// # 将参数转换为字符串
#define STRINGIFY(x)    #x
#define PRINT_INT(x)    printf(#x " = %d\n", x)

// ========== 连接运算符 ## ==========
// ## 将两个参数连接为一个标识符
#define CONCAT(a, b)    a ## b
#define MAKE_VAR(name)  var_ ## name

// ========== 可变参数宏 ==========
#define DEBUG_PRINT(fmt, ...) \
    printf("[DEBUG] %s:%d: " fmt "\n", \
           __FILE__, __LINE__, ##__VA_ARGS__)

// ========== 取消宏定义 ==========
#define TEMP 100
// ... 使用 TEMP ...
#undef TEMP  // 取消定义，之后 TEMP 不再定义

// ========== 预定义宏 ==========
void show_predefined(void) {
    printf("===== 预定义宏 =====\n");
    printf("__LINE__: %d\n", __LINE__);
    printf("__FILE__: %s\n", __FILE__);
    printf("__DATE__: %s\n", __DATE__);
    printf("__TIME__: %s\n", __TIME__);
    printf("__STDC__: %d\n", __STDC__);
    printf("__STDC_VERSION__: %ld\n", __STDC_VERSION__);
}

// ========== 条件编译中的宏 ==========
// 可以在编译时定义：gcc -DDEBUG 01_macros.c -o macros
// 或在这里取消注释：
// #define DEBUG

#ifdef DEBUG
    #define LOG(msg) printf("[LOG] %s\n", msg)
#else
    #define LOG(msg)  // 空宏，不产生任何代码
#endif

// ========== #error 和 #warning ==========
// #error 会导致编译失败
// #warning 会产生警告（非标准）

// 用于检测编译器或平台
// #ifndef __GNUC__
// #error "This code requires GCC compiler!"
// #endif

int main() {
    // ========== 常量宏 ==========
    printf("===== 常量宏 =====\n");
    printf("版本: %s\n", APP_VERSION);
    printf("作者: %s\n", AUTHOR);
    printf("PI = %f\n", PI);
    printf("最大缓冲: %d\n\n", MAX_BUFFER_SIZE);

    // ========== 函数式宏 ==========
    printf("===== 函数式宏 =====\n");

    int a = 5, b = 3;
    printf("SQUARE(%d) = %d\n", a, SQUARE(a));
    // 注意：宏是文本替换，不是函数调用
    printf("SQUARE(3+2) = %d (展开为 ((3+2)*(3+2)) )\n",
           SQUARE(3+2));
    printf("MAX(%d, %d) = %d\n", a, b, MAX(a, b));
    printf("MIN(%d, %d) = %d\n", a, b, MIN(a, b));
    printf("ABS(%d) = %d\n", -10, ABS(-10));
    printf("IS_EVEN(%d) = %s\n\n", a, IS_EVEN(a) ? "偶数" : "奇数");

    // ========== do-while 技巧 ==========
    printf("===== 多语句宏 =====\n");

    int x = 10, y = 20;
    printf("交换前: x=%d, y=%d\n", x, y);
    SWAP(x, y, int);
    printf("交换后: x=%d, y=%d\n\n", x, y);

    // ========== # 运算符 ==========
    printf("===== # 字符串化 =====\n");
    printf("STRINGIFY(123) = %s\n", STRINGIFY(123));
    printf("STRINGIFY(hello) = %s\n", STRINGIFY(hello));

    int val = 42;
    PRINT_INT(val);
    PRINT_INT(val + 5);
    printf("\n");

    // ========== ## 运算符 ==========
    printf("===== ## 连接 =====\n");

    int var_foo = 100;
    int var_bar = 200;

    CONCAT(var_, foo) = 300;  // 等价于 var_foo = 300
    printf("var_foo = %d\n", var_foo);

    int MAKE_VAR(result) = 500;  // int var_result = 500;
    printf("var_result = %d\n", var_result);
    printf("\n");

    // ========== 可变参数宏 ==========
    printf("===== 可变参数宏 =====\n");
    DEBUG_PRINT("这是一个调试消息");
    DEBUG_PRINT("a = %d, b = %d", a, b);

    // ========== 条件编译 ==========
    printf("\n===== 条件编译 =====\n");
    LOG("程序开始执行");
    LOG("处理数据中");
    LOG("程序结束");

    // ========== 预定义宏 ==========
    printf("\n");
    show_predefined();

    // ========== 宏 vs 函数 ==========
    printf("\n===== 宏 vs 函数 =====\n");

    printf("宏的优点:\n");
    printf("  1. 没有函数调用开销（内联展开）\n");
    printf("  2. 可以操作多种类型\n");
    printf("  3. 可以访问调用处的上下文(__LINE__, __FILE__)\n");

    printf("\n宏的缺点:\n");
    printf("  1. 没有类型检查\n");
    printf("  2. 多次求值问题（MAX(x++, y)）\n");
    printf("  3. 难以调试\n");
    printf("  4. 可能导致代码膨胀\n");

    printf("\n建议: 能写函数就用函数，宏仅用于:\n");
    printf("  - 简单常量定义\n");
    printf("  - 需要访问调用上下文的场景\n");
    printf("  - 需要操作多种类型的场景\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. #define 定义宏，纯文本替换
 * 2. 宏参数要加括号避免优先级问题
 * 3. # 将参数转为字符串
 * 4. ## 连接标识符
 * 5. 多语句宏用 do { } while(0) 包裹
 * 6. 可变参数宏用 __VA_ARGS__
 * 7. 预定义宏提供编译期信息
 * ============================================
 */
