/*
 * 知识点：退出状态和清理函数 (Exit Status and atexit)
 *
 * 编译指令：gcc 02_exit_and_atexit.c -o 02_exit_and_atexit.exe -std=c11 -Wall
 * 运行指令：./02_exit_and_atexit.exe
 *
 * 本文件演示程序的退出处理机制：
 *   - EXIT_SUCCESS (0)  —— 成功退出码
 *   - EXIT_FAILURE (1)  —— 失败退出码
 *   - exit()       —— 正常终止程序，会调用 atexit 注册的函数
 *   - atexit()     —— 注册程序退出时自动调用的清理函数
 *   - abort()      —— 异常终止程序（不调用 atexit 函数）
 *   - return       —— 从 main 返回与 exit() 等效
 *
 * 核心概念：
 *   atexit() 注册的函数在程序正常退出时按注册顺序的逆序调用
 *   常用于：关闭文件、释放内存、记录日志等清理操作
 *   abort() 用于紧急情况，不执行任何清理
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>

/* ===== atexit 清理函数 ===== */

/* 清理函数1：关闭资源 */
void cleanup_database(void) {
    printf("  [清理] 正在关闭数据库连接...\n");
    /* 实际应用中会执行断开数据库连接的操作 */
}

/* 清理函数2：保存配置文件 */
void cleanup_save_config(void) {
    printf("  [清理] 正在保存配置文件...\n");
    /* 实际应用中会执行写配置文件的操作 */
}

/* 清理函数3：释放内存 */
void cleanup_free_memory(void) {
    printf("  [清理] 正在释放动态分配的内存...\n");
    /* 实际应用中会执行 free() 操作 */
}

/* 清理函数4：记录退出日志 */
void cleanup_write_log(void) {
    printf("  [清理] 正在写入退出日志...\n");
}

/* atexit 函数的限制：最多注册 32 个函数（由 ATEXIT_MAX 定义）
 * 且被注册的函数不能接受参数，不能有返回值 */

/* ===== 示例函数：演示退出场景 ===== */

/* 使用 exit() 中途退出 */
void do_something_and_exit(void) {
    printf("\n进入 do_something_and_exit()...\n");
    printf("发生了一个致命错误，立即退出！\n");

    /* exit() 会：
     * 1. 调用所有 atexit 注册的函数（逆序）
     * 2. 刷新所有输出缓冲区
     * 3. 关闭所有打开的文件流
     * 4. 返回退出码给操作系统 */
    exit(EXIT_FAILURE);

    /* exit() 之后的代码永远不会执行 */
    printf("这行代码不会被执行！\n");
}

/* 演示 abort() */
void demo_abort(void) {
    printf("  abort() 不会执行 atexit 函数！\n");
    printf("  abort() 会生成核心转储文件（如果系统配置了）\n");
    printf("  abort() 发送 SIGABRT 信号\n");

    /* abort() 导致程序异常终止：
     * - 不调用 atexit 函数
     * - 不刷新缓冲区
     * - 返回一个与实现相关的终止状态，表示失败
     * - 尝试关闭文件（可能不刷新缓冲区）*/
    abort();

    printf("这行代码不会被执行！\n");
}

int main() {
    printf("============================================\n");
    printf("  退出状态和清理函数演示\n");
    printf("============================================\n\n");

    /* ===== 1. 注册清理函数 ===== */
    printf("----- 1. 注册 atexit 清理函数 -----\n");

    /* atexit() 注册的函数会在程序退出时被自动调用
     * 多个函数的调用顺序与注册顺序相反（后进先出） */
    printf("正在注册清理函数...\n");

    if (atexit(cleanup_write_log) != 0) {
        printf("警告：注册 cleanup_write_log 失败！\n");
    }
    if (atexit(cleanup_free_memory) != 0) {
        printf("警告：注册 cleanup_free_memory 失败！\n");
    }
    if (atexit(cleanup_save_config) != 0) {
        printf("警告：注册 cleanup_save_config 失败！\n");
    }
    if (atexit(cleanup_database) != 0) {
        printf("警告：注册 cleanup_database 失败！\n");
    }

    printf("已注册 4 个清理函数\n");
    printf("退出时将按逆序执行：database -> save_config -> free_memory -> write_log\n\n");

    /* ===== 2. EXIT_SUCCESS 和 EXIT_FAILURE ===== */
    printf("----- 2. 退出码常量 -----\n");

    printf("EXIT_SUCCESS = %d (表示程序成功完成)\n", EXIT_SUCCESS);
    printf("EXIT_FAILURE = %d (表示程序执行失败)\n", EXIT_FAILURE);
    printf("\n在批处理/Shell 脚本中可通过 %%ERRORLEVEL%% / $? 获取退出码\n\n");

    /* ===== 3. return 与 exit 的关系 ===== */
    printf("----- 3. return 与 exit 的关系 -----\n");

    printf("main 函数中的 return(N) 等价于 exit(N)\n");
    printf("两者都会执行 atexit 注册的函数\n");
    printf("建议：用 return 从 main 退出，用 exit 从其他函数退出\n\n");

    /* ===== 4. atexit 使用限制 ===== */
    printf("----- 4. atexit 注意事项 -----\n");

    printf("1) 注册的函数不能有参数\n");
    printf("2) 注册的函数不能有返回值\n");
    printf("3) 可注册的函数数量有限（通常 32 个）\n");
    printf("4) _exit() 和 _Exit() 不会调用 atexit 函数\n");
    printf("5) 子进程调用 exit() 不会调用父进程注册的 atexit\n");
    printf("6) 如果函数崩溃，剩下的 atexit 函数仍会执行\n\n");

    /* ===== 5. 模拟正常退出 ===== */
    printf("----- 5. 正常退出演示 -----\n\n");

    printf("主程序执行完成，即将退出...\n");
    printf("注册的清理函数将按逆序自动执行：\n\n");

    /* 使用 return 0 退出，效果等价于 exit(EXIT_SUCCESS) */
    return EXIT_SUCCESS;

    /* 实际上 return 0 和 return EXIT_SUCCESS 是等价的 */
}

/*
 * 补充说明 - 各种退出方式的区别：
 *
 * | 方式            | 调用 atexit | 刷新缓冲区 | 文件关闭 | 返回值 |
 * |-----------------|-------------|-----------|---------|--------|
 * | return (main)   | 是          | 是        | 是      | return 值 |
 * | exit(n)         | 是          | 是        | 是      | n       |
 * | _Exit(n)        | 否          | 否        | 实现定义 | n       |
 * | _exit(n)        | 否          | 否        | 实现定义 | n       |
 * | abort()         | 否          | 否        | 可能   | SIGABRT |
 */
