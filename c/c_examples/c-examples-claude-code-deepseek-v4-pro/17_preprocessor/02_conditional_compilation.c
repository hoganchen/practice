/*
 * ============================================
 * 知识点：条件编译
 * 说明：
 *   条件编译根据某些条件决定编译哪些代码。
 *   常用于跨平台、调试模式、功能开关等。
 *
 *   指令：
 *   #if, #elif, #else, #endif  — 条件判断
 *   #ifdef, #ifndef            — 检查宏是否定义
 *   #define, #undef            — 定义/取消宏
 *   #pragma                    — 编译器指令
 *
 * 编译方法：
 *   普通编译：gcc 02_conditional_compilation.c -o 02_conditional_compilation
 *   带定义：gcc -DDEBUG -DPLATFORM=1 02_conditional_compilation.c
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"

// ========== 调试开关 ==========
// 编译时用 -DDEBUG 启用调试
// #define DEBUG 1

#ifdef DEBUG
    #define DEBUG_MSG(msg) \
        printf("[DEBUG] %s:%d: %s\n", __FILE__, __LINE__, msg)
    #define DEBUG_VAR(fmt, var) \
        printf("[DEBUG] %s:%d: " #var " = " fmt "\n", \
               __FILE__, __LINE__, var)
#else
    #define DEBUG_MSG(msg)      // 空
    #define DEBUG_VAR(fmt, var) // 空
#endif

// ========== 平台检测 ==========
#if defined(_WIN32) || defined(_WIN64)
    #define PLATFORM_WINDOWS 1
    #define CLEAR_SCREEN() system("cls")
    #define PLATFORM_NAME "Windows"
#elif defined(__linux__)
    #define PLATFORM_LINUX 1
    #define CLEAR_SCREEN() system("clear")
    #define PLATFORM_NAME "Linux"
#elif defined(__APPLE__)
    #define PLATFORM_MAC 1
    #define CLEAR_SCREEN() system("clear")
    #define PLATFORM_NAME "macOS"
#else
    #define PLATFORM_UNKNOWN 1
    #define CLEAR_SCREEN()
    #define PLATFORM_NAME "Unknown"
#endif

// ========== 编译器检测 ==========
#if defined(__GNUC__)
    #define COMPILER "GCC"
    #define COMPILER_VER __GNUC__
#elif defined(_MSC_VER)
    #define COMPILER "MSVC"
    #define COMPILER_VER _MSC_VER
#elif defined(__clang__)
    #define COMPILER "Clang"
    #define COMPILER_VER __clang_major__
#else
    #define COMPILER "Unknown"
    #define COMPILER_VER 0
#endif

// ========== 功能开关 ==========
#define FEATURE_NETWORK  1   // 网络功能
#define FEATURE_DATABASE 0   // 数据库功能（关闭）
#define FEATURE_GRAPHICS 1   // 图形功能

// ========== C标准版本检测 ==========
#if __STDC_VERSION__ >= 201112L
    #define C11_OR_LATER 1
#else
    #define C11_OR_LATER 0
#endif

#if __STDC_VERSION__ >= 199901L
    #define C99_OR_LATER 1
#else
    #define C99_OR_LATER 0
#endif

// ========== #pragma 示例 ==========
// #pragma once        // 防止头文件重复包含（非标准但广泛支持）
// #pragma pack(push, 1)  // 设置内存对齐为 1 字节

// ========== #warning 和 #error ==========
// #warning "这个功能还在开发中"  // 非标准，但很多编译器支持
// #ifndef SOME_REQUIRED_MACRO
//     #error "SOME_REQUIRED_MACRO must be defined!"
// #endif

// ========== #pragma message ==========
// 在编译时显示消息
#ifdef _MSC_VER
    #pragma message("Compiling with MSVC")
#endif

// ========== 版本断言 ==========
#if __STDC_VERSION__ < 199901L
    // 对于不支持 C99 的编译器给出提示
    #define NO_VLA 1
#else
    #define NO_VLA 0
#endif

int main() {
    // ========== 调试信息 ==========
    printf("===== 条件编译 =====\n");

    DEBUG_MSG("程序开始执行");
    int counter = 42;
    DEBUG_VAR("%d", counter);

    // 非调试模式时，DEBUG_MSG 不产生任何代码
    // 比 if (debug) 方式更高效（完全不生成代码）

    // ========== 平台信息 ==========
    printf("\n===== 平台信息 =====\n");
    printf("平台: %s\n", PLATFORM_NAME);
    printf("编译器: %s (ver %d)\n", COMPILER, COMPILER_VER);

    #ifdef PLATFORM_WINDOWS
        printf("使用 Windows API 实现...\n");
    #elif defined(PLATFORM_LINUX)
        printf("使用 POSIX API 实现...\n");
    #endif

    printf("C标准版本: %ld\n", __STDC_VERSION__);
    printf("支持C99: %s\n", C99_OR_LATER ? "是" : "否");
    printf("支持C11: %s\n", C11_OR_LATER ? "是" : "否");

    // ========== 功能开关 ==========
    printf("\n===== 功能开关 =====\n");

    printf("功能配置:\n");

    #if FEATURE_NETWORK
        printf("  [v] 网络功能 (已启用)\n");
        // 实际的网络代码...
    #else
        printf("  [x] 网络功能 (已禁用)\n");
    #endif

    #if FEATURE_DATABASE
        printf("  [v] 数据库功能 (已启用)\n");
    #else
        printf("  [x] 数据库功能 (已禁用)\n");
    #endif

    #if FEATURE_GRAPHICS
        printf("  [v] 图形功能 (已启用)\n");
    #else
        printf("  [x] 图形功能 (已禁用)\n");
    #endif

    // ========== C标准版本适配 ==========
    printf("\n===== C标准版本适配 =====\n");

    #if C11_OR_LATER
        printf("使用 C11 特性...\n");
        // _Static_assert(1, "编译时断言");
    #elif C99_OR_LATER
        printf("使用 C99 特性...\n");
        // 变长数组 (VLA) 等
    #else
        printf("使用 C89 兼容代码...\n");
        // 所有变量必须在代码块开头声明
    #endif

    // ========== #if vs #ifdef ==========
    printf("\n===== #if vs #ifdef =====\n");

    /*
     * #ifdef MACRO  — 检查 MACRO 是否定义（不管值是多少）
     * #if MACRO     — 检查 MACRO 的值是否为非零
     */

    #define TEST_DEFINE   // 定义了，但没有值

    #ifdef TEST_DEFINE
        printf("#ifdef TEST_DEFINE: 成立（定义了）\n");
    #endif

    #ifdef TEST_DEFINE
        printf("TEST_DEFINE 已定义 (值: \"%s\")\n",
               "TEST_DEFINE" "");
    #endif

    // #if defined(MACRO) 等价于 #ifdef MACRO
    #if defined(TEST_DEFINE)
        printf("defined(TEST_DEFINE): 成立\n");
    #endif

    // ========== 编译时消息 ==========
    printf("\n===== 编译时信息 =====\n");

    // 在编译命令中添加 -D 可以控制宏
    printf("编译时可用 -D 定义宏:\n");
    printf("  gcc -DDEBUG -DLOG_LEVEL=2 %s\n", __FILE__);

    #ifdef LOG_LEVEL
        printf("日志级别: %d\n", LOG_LEVEL);
    #else
        printf("日志级别: 未定义 (默认)\n");
    #endif

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. #if/#elif/#else/#endif — 条件代码块
 * 2. #ifdef/#ifndef — 检查宏是否定义
 * 3. 条件编译用于：调试、跨平台、功能开关
 * 4. #ifdef 检查定义，#if 检查值
 * 5. 编译时用 -D 定义宏
 * 6. #error 和 #warning 在编译期输出信息
 * ============================================
 */
