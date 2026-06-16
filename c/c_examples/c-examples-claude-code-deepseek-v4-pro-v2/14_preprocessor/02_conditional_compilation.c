/**
 * ============================================================
 *  知识点: 条件编译 (Conditional Compilation)
 *
 *  编译指令:
 *    gcc 02_conditional_compilation.c -o 02_conditional_compilation.exe -std=c11 -Wall
 *    gcc -DDEBUG 02_conditional_compilation.c -o 02_conditional_compilation_debug.exe -std=c11 -Wall
 *
 *  本文件演示:
 *    1. #if, #ifdef, #ifndef, #else, #elif, #endif
 *    2. #if defined() / #if !defined()
 *    3. 调试日志模式 (通过 -DDEBUG 开启)
 *    4. 平台特定代码
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

/* =================================================================
 *  1. #ifdef / #ifndef — 检查宏是否被定义
 *
 *  #ifdef MACRO    等价于  #if defined(MACRO)
 *  #ifndef MACRO   等价于  #if !defined(MACRO)
 * ================================================================= */

/* 如果定义了 DEBUG 宏, 才包含调试用的头文件和函数 */
#ifdef DEBUG
    #define DEBUG_LOG(msg)    printf("[DEBUG] %s\n", msg)
    #define DEBUG_INT(val)    printf("[DEBUG] %s = %d\n", #val, val)
#else
    /* 在非调试版本中, 调试宏展开为空语句 */
    #define DEBUG_LOG(msg)    ((void)0)
    #define DEBUG_INT(val)    ((void)0)
#endif

/* =================================================================
 *  2. #if / #elif / #else — 数值条件编译
 *
 *  可以基于常量表达式选择不同的代码路径。
 * ================================================================= */

/* 定义编译模式选择: 1=普通模式, 2=详细模式, 3=静默模式 */
#define OUTPUT_MODE 2

/* =================================================================
 *  3. 平台检测 (常见的预定义宏)
 *
 *  编译器预定义了一些宏来标识平台:
 *    _WIN32   — Windows 平台 (32-bit 和 64-bit)
 *    __linux__ — Linux 平台
 *    __APPLE__ — macOS / iOS
 *    __unix__  — Unix 系统
 * ================================================================= */

/* 如果没有定义任何平台宏, 则默认定义为"未知平台" */
#ifndef PLATFORM_NAME
    #if defined(_WIN32)
        #define PLATFORM_NAME "Windows"
    #elif defined(__linux__)
        #define PLATFORM_NAME "Linux"
    #elif defined(__APPLE__)
        #define PLATFORM_NAME "macOS"
    #else
        #define PLATFORM_NAME "未知平台"
    #endif
#endif

/* =================================================================
 *  4. 特性检测: 某些功能只在特定条件下可用
 * ================================================================= */

/* 假设某些功能需要在特定版本中启用 */
#define FEATURE_LEVEL 2

/* =================================================================
 *  5. 防止重复包含 (Header Guard 的模拟)
 *
 *  实际的头文件中常用:
 *    #ifndef HEADER_NAME_H
 *    #define HEADER_NAME_H
 *    ...
 *    #endif
 *
 *  这里只是演示 #ifndef 的用法。
 * ================================================================= */


/*------------------------------------------------------------------
 *  主函数
 *------------------------------------------------------------------*/
int main(void)
{
    printf("========================================\n");
    printf("  条件编译 (Conditional Compilation)\n");
    printf("========================================\n\n");

    /*--------------------------------------------------------------
     *  1. DEBUG 模式的演示
     *
     *  编译时加 -DDEBUG 会开启调试日志:
     *    gcc -DDEBUG 02_conditional_compilation.c -o debug.exe -std=c11 -Wall
     *
     *  不加 -DDEBUG 编译则调试日志为空操作
     *--------------------------------------------------------------*/
    printf("=== 1. 调试日志 (#ifdef DEBUG) ===\n");

    int x = 42;
    int y = 100;

    /* DEBUG_LOG 和 DEBUG_INT 只有在定义了 DEBUG 宏时才会输出 */
    DEBUG_LOG("进入 main 函数");
    DEBUG_INT(x);
    DEBUG_INT(y);

    printf("程序正常运行中...\n");
    printf("x + y = %d\n", x + y);

    DEBUG_LOG("main 函数结束");
    printf("\n");
    printf("提示: 编译时加 -DDEBUG 可以看到调试信息\n\n");

    /*--------------------------------------------------------------
     *  2. #if / #elif / #else 数值条件编译
     *--------------------------------------------------------------*/
    printf("=== 2. #if / #elif / #else 数值条件 ===\n");

    printf("OUTPUT_MODE = %d\n", OUTPUT_MODE);

    #if OUTPUT_MODE == 1
        printf("输出模式: 普通模式 (只显示基本信息)\n");
    #elif OUTPUT_MODE == 2
        printf("输出模式: 详细模式 (显示更多细节)\n");
        printf("  - 当前时间: ");
        /* 模拟一些额外输出 */
        printf("(额外详细信息)\n");
    #elif OUTPUT_MODE == 3
        /* 静默模式: 什么都不输出 */
    #else
        printf("输出模式: 未知模式 (%d)\n", OUTPUT_MODE);
    #endif

    printf("\n");

    /*--------------------------------------------------------------
     *  3. 平台特定代码
     *--------------------------------------------------------------*/
    printf("=== 3. 平台检测 ===\n");

    printf("当前平台: %s\n", PLATFORM_NAME);

    #if defined(_WIN32)
        printf("检测到 Windows 平台\n");
        printf("Windows 特定操作: 使用 Sleep(1000) 等\n");
        /* 这里可以放 Windows 特定的代码 */
        /* #include <windows.h> */
    #elif defined(__linux__)
        printf("检测到 Linux 平台\n");
        printf("Linux 特定操作: 使用 sleep(1) 等\n");
        /* 这里可以放 Linux 特定的代码 */
        /* #include <unistd.h> */
    #elif defined(__APPLE__)
        printf("检测到 macOS 平台\n");
        printf("macOS 特定操作\n");
    #else
        printf("未知平台, 使用通用代码\n");
    #endif
    printf("\n");

    /*--------------------------------------------------------------
     *  4. #if defined() 和 #if !defined()
     *
     *  #if defined(DEBUG) 等价于 #ifdef DEBUG
     *  #if !defined(DEBUG) 等价于 #ifndef DEBUG
     *
     *  但 defined() 可以与逻辑运算符组合!
     *--------------------------------------------------------------*/
    printf("=== 4. #if defined() / !defined() ===\n");

    #if defined(DEBUG) && defined(_WIN32)
        printf("Windows 调试模式: 同时满足两个条件\n");
    #endif

    #if !defined(__linux__)
        printf("这不是 Linux 平台 (通过 !defined 检测)\n");
    #endif
    printf("\n");

    /*--------------------------------------------------------------
     *  5. #if 的多条件组合
     *--------------------------------------------------------------*/
    printf("=== 5. 功能级别选择 ===\n");

    #if FEATURE_LEVEL >= 3
        printf("功能级别 3: 包含所有高级功能\n");
        /* 高级功能代码 */
    #elif FEATURE_LEVEL >= 2
        printf("功能级别 2: 包含标准功能 + 扩展功能\n");
        /* 扩展功能代码 */
    #elif FEATURE_LEVEL >= 1
        printf("功能级别 1: 仅包含基本功能\n");
        /* 基本功能代码 */
    #else
        printf("功能级别 0: 最小功能集\n");
    #endif
    printf("\n");

    /*--------------------------------------------------------------
     *  6. #ifdef 在头文件中的典型用途 (模拟)
     *--------------------------------------------------------------*/
    printf("=== 6. 头文件保护 (Header Guard) 模拟 ===\n");

    /* 模拟头文件保护: 检查 MY_HEADER_H 是否已定义 */
    #ifndef MY_HEADER_H
        #define MY_HEADER_H

        /* 只有在第一次包含时才定义这些内容 */
        printf("第一次包含: 定义结构体、函数等\n");

    #endif /* MY_HEADER_H */

    /* 再次检查: #ifndef MY_HEADER_H 会跳过 */
    printf("第二次包含: 因为 MY_HEADER_H 已定义, 内容被跳过\n");
    printf("这正是头文件防止重复包含的原理\n");
    printf("\n");

    /*--------------------------------------------------------------
     *  7. 综合示例: 调试版本与发布版本的差异
     *--------------------------------------------------------------*/
    printf("=== 7. 调试版本 vs 发布版本 ===\n");

    #ifdef DEBUG
        printf("这是调试版本 (Debug Build)\n");
        printf("  - 开启调试日志\n");
        printf("  - 开启断言检查\n");
        printf("  - 包含额外诊断信息\n");
    #else
        printf("这是发布版本 (Release Build)\n");
        printf("  - 关闭调试日志\n");
        printf("  - 关闭断言检查\n");
        printf("  - 代码更小更快\n");
    #endif

    return 0;
}
