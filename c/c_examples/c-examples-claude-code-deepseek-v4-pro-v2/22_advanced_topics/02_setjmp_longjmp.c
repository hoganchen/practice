/*
 * 知识点：非局部跳转 (Non-local Jumps with setjmp/longjmp)
 *
 * 编译指令：gcc 02_setjmp_longjmp.c -o 02_setjmp_longjmp.exe -std=c11 -Wall
 * 运行指令：./02_setjmp_longjmp.exe
 *
 * 本文件演示 setjmp 和 longjmp 的使用：
 *   - setjmp()   —— 保存当前栈上下文（jmp_buf）
 *   - longjmp()  —— 恢复到之前保存的上下文（非局部跳转）
 *
 * 核心概念：
 *   setjmp/longjmp 提供了一种"非局部 goto"机制
 *   允许程序从一个函数直接跳回到之前某个函数中保存的上下文
 *   常用于：错误恢复、深度嵌套的错误处理
 *
 * 与 goto 的区别：
 *   goto 只能在同一个函数内跳转
 *   longjmp 可以跨越多个函数调用栈
 *
 * 注意事项：
 *   1) longjmp 不会执行中间函数的清理代码
 *   2) setjmp 返回 0 表示第一次到达，非 0 表示从 longjmp 返回
 *   3) 需要 #include <setjmp.h>
 *   4) 避免在信号处理中滥用
 *   5) 局部变量在 longjmp 后的值可能不确定
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>
#include <setjmp.h>  /* setjmp/longjmp 所需的头文件 */
#include <string.h>

/* ===== 全局跳转缓冲区 ===== */

/*
 * jmp_buf 是一个数组类型，用于存储恢复执行所需的上下文信息
 * 包括：程序计数器、栈指针、寄存器等
 * 通常作为全局变量或在函数间传递
 */
static jmp_buf g_error_recovery;  /* 错误恢复的跳转点 */
static jmp_buf g_retry_point;     /* 重试跳转点 */

/* 错误等级枚举 */
typedef enum {
    ERR_NONE = 0,
    ERR_MINOR = 1,   /* 轻微错误 */
    ERR_MODERATE = 2,/* 中等错误 */
    ERR_FATAL = 3    /* 致命错误 */
} ErrorLevel;

/* ===== 模拟的资源管理 ===== */

/* 模拟文件打开 */
static int s_file_open = 0;

void open_file(void) {
    printf("  [资源] 打开文件...\n");
    s_file_open = 1;
}

void close_file(void) {
    if (s_file_open) {
        printf("  [资源] 关闭文件...\n");
        s_file_open = 0;
    }
}

/* 模拟内存分配 */
static int s_memory_allocated = 0;

void *allocate_memory(size_t size) {
    void *ptr = malloc(size);
    if (ptr != NULL) {
        printf("  [资源] 分配内存: %zu 字节\n", size);
        s_memory_allocated = 1;
    }
    return ptr;
}

void free_memory(void *ptr) {
    if (ptr != NULL) {
        printf("  [资源] 释放内存\n");
        free(ptr);
        s_memory_allocated = 0;
    }
}

/* ===== 深层嵌套的函数 ===== */

/**
 * 第 3 层函数：处理数据
 * 当发生错误时使用 longjmp 跳回主函数的恢复点
 */
void process_level3(int depth) {
    printf("  进入函数 level3 (深度 %d/%d)\n", depth, 3);

    /* 模拟可能发生的错误 */
    if (depth > 2) {
        printf("  错误！深度 %d 超出限制！\n", depth);

        /*
         * longjmp(缓冲区, 返回值)
         * 跳转到之前 setjmp 保存的位置
         * 第二个参数作为 setjmp 的返回值（必须非 0）
         */
        printf("  执行 longjmp 跳转到错误恢复点！\n\n");
        longjmp(g_error_recovery, ERR_MODERATE);
        /* longjmp 后的代码不会执行！*/
    }

    printf("  离开函数 level3\n");
}

/**
 * 第 2 层函数：中间处理
 */
void process_level2(int depth) {
    printf("  进入函数 level2 (深度 %d/%d)\n", depth, 2);

    /* 调用下一层 */
    process_level3(depth);

    printf("  离开函数 level2\n");
}

/**
 * 第 1 层函数：入口处理
 */
void process_level1(int depth) {
    printf("  进入函数 level1 (深度 %d/%d)\n", depth, 1);

    /* 调用下一层 */
    process_level2(depth);

    printf("  离开函数 level1\n");
}

/* ===== 带重试机制的解析函数 ===== */

/**
 * 模拟解析用户输入
 * 如果出错，使用 longjmp 回到主函数的重试点
 */
void parse_input(const char *input) {
    printf("  [解析] 正在解析: \"%s\"\n", input);

    if (input == NULL || strlen(input) == 0) {
        printf("  [解析] 错误：空输入！\n");

        /* 跳转回重试点，要求重新输入 */
        longjmp(g_retry_point, 1);
    }

    if (input[0] == 'q') {
        printf("  [解析] 正常退出解析。\n");
        longjmp(g_error_recovery, ERR_NONE);
    }

    printf("  [解析] 解析成功！\n");
}

/* ===== 主函数 ===== */

int main() {
    printf("============================================\n");
    printf("  setjmp/longjmp 非局部跳转演示\n");
    printf("============================================\n\n");

    /* ===== 1. 基本用法：错误恢复 ===== */
    printf("----- 1. 错误恢复模式 -----\n");

    /*
     * setjmp(缓冲区)
     * 保存当前执行上下文到 jmp_buf 中
     * 返回值：
     *   0 —— 第一次直接调用 setjmp
     *   非 0 —— 由 longjmp 跳转回来（返回值是 longjmp 的第二个参数）
     */
    int error_code = setjmp(g_error_recovery);
    if (error_code == 0) {
        /* 第一次执行：正常路径 */
        printf("  [setjmp] 设置错误恢复点 (首次调用)\n\n");

        /* 打开资源 */
        open_file();
        void *buf = allocate_memory(1024);

        /* 调用深层嵌套的函数 */
        process_level1(3);  /* 深度 3 会触发 longjmp */

        /* 如果 process_level1 没有出错，会继续执行到这里 */
        printf("\n  正常路径完成。\n");

        /* 释放资源 */
        free_memory(buf);
        close_file();
    } else {
        /*
         * 从 longjmp 跳转回来的路径
         * error_code 是 longjmp 的第二个参数
         */
        printf("\n  [setjmp] 从 longjmp 返回，错误码: %d\n", error_code);
        printf("  [setjmp] 执行错误恢复...\n");

        /* 错误恢复逻辑 */
        if (s_file_open) {
            close_file();
        }
        if (s_memory_allocated) {
            free_memory((void *)0x1);  /* 实际中应保存指针 */
        }

        printf("  错误已处理，程序继续运行。\n");
    }

    printf("\n");

    /* ===== 2. 重试机制演示 ===== */
    printf("----- 2. 重试机制演示 -----\n");

    int retry_count = 0;
    int result = setjmp(g_retry_point);

    if (result == 0) {
        /* 首次设置重试点 */
        printf("  [重试] 设置重试点 (首次)\n");
    } else {
        /* 从 longjmp 返回，需要重试 */
        retry_count++;
        printf("  [重试] 第 %d 次重试...\n", retry_count);

        if (retry_count >= 3) {
            printf("  [重试] 重试次数过多，放弃。\n");
            goto cleanup;
        }
    }

    const char *inputs[] = {"", "hello", "", "q"};
    static int input_index = 0;

    if (input_index < 4) {
        parse_input(inputs[input_index]);
        input_index++;
        /*
         * 如果 parse_input 遇到错误，会 longjmp 回到 setjmp 处
         * 否则正常执行到这里
         */
    }

cleanup:
    printf("\n");

    /* ===== 3. setjmp/longjmp vs goto ===== */
    printf("----- 3. setjmp/longjmp vs goto -----\n");

    printf("  goto:\n");
    printf("    - 只能在同一函数内跳转\n");
    printf("    - 编译时确定跳转目标\n");
    printf("    - 简单直接\n\n");

    printf("  setjmp/longjmp:\n");
    printf("    - 可以跨越多个函数跳转（非局部）\n");
    printf("    - 跳转目标在运行时确定\n");
    printf("    - 可用于错误恢复模式\n");
    printf("    - 可用在库函数中向上通知错误\n\n");

    /* ===== 4. 注意事项 ===== */
    printf("----- 4. 注意事项和警告 -----\n");

    printf("  1) longjmp 不执行中间函数中的清理代码\n");
    printf("  2) 在 C++ 中可能跳过析构函数，C 中需手动清理\n");
    printf("  3) 局部变量的值在 longjmp 后可能未定义\n");
    printf("  4) volatile 局部变量可以保证 longjmp 后值正确\n");
    printf("  5) 不要跳转到已返回的函数（未定义行为）\n");
    printf("  6) 谨慎使用，过度使用会使代码难以理解\n");

    printf("\n============================================\n");
    printf("  程序结束\n");
    printf("============================================\n");

    return 0;
}
