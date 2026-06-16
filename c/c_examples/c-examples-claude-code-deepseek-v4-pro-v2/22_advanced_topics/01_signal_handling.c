/*
 * 知识点：信号处理 (Signal Handling)
 *
 * 编译指令：gcc 01_signal_handling.c -o 01_signal_handling.exe -std=c11 -Wall
 * 运行指令：./01_signal_handling.exe
 *
 * 本文件演示 C 标准库中的信号处理机制：
 *   - signal()    —— 注册信号处理函数
 *   - SIGINT      —— 中断信号（Ctrl+C）
 *   - SIGTERM     —— 终止信号
 *   - raise()     —— 发送信号
 *   - 信号处理函数的限制（异步信号安全）
 *
 * 核心概念：
 *   信号是操作系统向进程发送的异步通知，用于通知发生特定事件
 *   信号处理函数应尽量简单，只做最低限度的处理
 *   在信号处理函数中只能调用"异步信号安全"(async-signal-safe)的函数
 *
 * 常见信号：
 *   SIGINT  (2)   — 终端中断（Ctrl+C）
 *   SIGTERM (15)  — 终止信号
 *   SIGSEGV (11)  — 段错误（无效内存访问）
 *   SIGFPE  (8)   — 浮点异常（除零等）
 *   SIGABRT (6)   — abort() 调用产生
 *   SIGALRM (14)  — 定时器到期
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>
#include <signal.h>
#include <unistd.h>  /* sleep / alarm */

/* ===== 全局标志 ===== */

/*
 * 标志位：标记是否需要优雅退出
 * volatile: 防止编译器优化（信号处理函数可能异步修改此变量）
 * sig_atomic_t: 保证读写是原子操作，适合在信号处理函数中使用
 */
static volatile sig_atomic_t g_quit_flag = 0;

/*
 * 计数器：记录收到信号的次数
 */
static volatile sig_atomic_t g_signal_count = 0;

/* ===== 信号处理函数 ===== */

/**
 * SIGINT 信号处理函数
 * 当用户按下 Ctrl+C 时触发
 *
 * 信号处理函数的要求：
 * 1. 参数为 int（信号编号）
 * 2. 返回类型为 void
 * 3. 应尽量简短
 * 4. 只调用 async-signal-safe 函数
 *
 * 安全的函数列表（部分）：
 *   write(), _exit(), signal(), raise()
 *   （不安全的：printf, malloc, free, 大多数标准库函数）
 */
void sigint_handler(int sig) {
    /* 注意：printf 不是 async-signal-safe 的！
     * 这里为了演示而使用，生产代码中应避免 */
    (void)sig;  /* 抑制未使用参数警告 */

    g_signal_count++;

    printf("\n  [信号处理] 收到 SIGINT (Ctrl+C)！次数: %d\n", g_signal_count);

    if (g_signal_count >= 3) {
        printf("  [信号处理] 已收到 3 次中断，即将退出...\n");
        g_quit_flag = 1;

        /* 恢复 SIGINT 的默认行为
         * SIG_DFL 表示使用默认处理方式（终止进程） */
        signal(SIGINT, SIG_DFL);
    } else {
        printf("  [信号处理] 再按 Ctrl+C %d 次将退出\n", 3 - g_signal_count);
    }
}

/**
 * SIGTERM 信号处理函数
 * 用于请求进程终止（如 kill 命令默认发送此信号）
 */
void sigterm_handler(int sig) {
    (void)sig;

    printf("\n  [信号处理] 收到 SIGTERM，正在清理并退出...\n");
    g_quit_flag = 1;
}

#ifdef SIGUSR1
/**
 * 自定义信号：SIGUSR1
 * 用户自定义信号，用于进程间通信
 * 注意：SIGUSR1 在 Windows/MinGW 上可能未定义
 */
void sigusr1_handler(int sig) {
    (void)sig;

    printf("\n  [信号处理] 收到 SIGUSR1！自定义用户信号\n");
    printf("  [信号处理] 可以通过 kill -USR1 PID 发送此信号\n");
}
#endif

/* ===== 主函数 ===== */

int main() {
    printf("============================================\n");
    printf("  信号处理演示\n");
    printf("============================================\n\n");

    /* ===== 1. 注册信号处理函数 ===== */
    printf("----- 1. 注册信号处理函数 -----\n");

    /*
     * signal(信号编号, 处理函数指针)
     * 将指定信号与处理函数关联
     *
     * 处理函数可以是：
     *   - 自定义函数指针
     *   - SIG_IGN: 忽略该信号
     *   - SIG_DFL: 使用默认行为
     */
    signal(SIGINT, sigint_handler);   /* Ctrl+C */
    signal(SIGTERM, sigterm_handler); /* kill 命令 */
#ifdef SIGUSR1
    signal(SIGUSR1, sigusr1_handler); /* 用户自定义信号 */
#endif

    printf("  已注册处理函数:\n");
    printf("    SIGINT  (编号 %d) — Ctrl+C\n", SIGINT);
    printf("    SIGTERM (编号 %d) — kill 命令\n", SIGTERM);
#ifdef SIGUSR1
    printf("    SIGUSR1 (编号 %d) — 用户信号\n", SIGUSR1);
#endif
    printf("\n");

    /* ===== 2. 发送信号演习 ===== */
    printf("----- 2. 使用 raise() 发送信号 -----\n");

#ifdef SIGUSR1
    printf("  调用 raise(SIGUSR1) 发送信号给自己...\n");
    raise(SIGUSR1);
    printf("  信号处理完成，返回主程序。\n");
#else
    printf("  当前平台不支持 SIGUSR1，跳过演示。\n");
#endif
    printf("\n");

    /* ===== 3. 信号处理限制演示 ===== */
    printf("----- 3. 信号处理重要说明 -----\n");

    printf("  1) 处理函数应尽量短小精悍\n");
    printf("  2) 只能调用 async-signal-safe 函数\n");
    printf("  3) 不可在信号处理中调用 printf/malloc/free 等\n");
    printf("  4) 共享变量必须用 volatile sig_atomic_t\n");
    printf("  5) 某些信号不可捕获（SIGKILL, SIGSTOP）\n\n");

    /* ===== 4. 主循环 ===== */
    printf("----- 4. 主循环（等待信号）-----\n");
    printf("  请尝试:\n");
    printf("  1) 按 Ctrl+C 发送 SIGINT\n");
    printf("  2) 打开另一个终端，执行:\n");
#ifdef SIGUSR1
    printf("     kill -USR1 %d\n", getpid());
#endif
    printf("     kill        %d  (SIGTERM)\n", getpid());
    printf("\n");

    printf("  主程序运行中（按 Ctrl+C 3 次退出）...\n");

    /* 主循环：每隔 1 秒检查退出标志 */
    int loop_count = 0;
    while (!g_quit_flag) {
        printf("  运行中... (%d 秒), PID: %d\n", loop_count, getpid());
        loop_count++;

        /* sleep 1 秒 */
        sleep(1);

        /* 如果循环次数达到 15 次，自动退出 */
        if (loop_count >= 15) {
            printf("\n  演示超时，自动退出。\n");
            break;
        }
    }

    /* ===== 5. 清理 ===== */
    printf("\n----- 5. 恢复默认信号处理 -----\n");

    /* 恢复默认信号处理 */
    signal(SIGINT, SIG_DFL);
    signal(SIGTERM, SIG_DFL);
#ifdef SIGUSR1
    signal(SIGUSR1, SIG_DFL);
#endif

    printf("  信号处理已恢复为默认行为。\n");

    printf("\n============================================\n");
    printf("  程序结束\n");
    printf("============================================\n");

    return 0;
}
