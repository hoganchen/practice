/*
 * ============================================
 * 知识点：信号处理 <signal.h>
 * 说明：
 *   信号是操作系统向进程发送的异步通知。
 *   用于处理中断、错误、终止请求等事件。
 *
 *   常用信号：
 *   SIGINT   — 终端中断信号（Ctrl+C）
 *   SIGTERM  — 终止信号（kill 默认发送）
 *   SIGSEGV  — 段错误（非法内存访问）
 *   SIGFPE   — 浮点异常（除零等）
 *   SIGABRT  — abort() 调用
 *   SIGALRM  — 定时器到期
 *   SIGUSR1/2— 用户自定义信号
 *
 *   函数：
 *   signal(signum, handler)   — 注册信号处理函数
 *   raise(signum)             — 向自己发送信号
 *   abort()                   — 发送 SIGABRT
 *   kill(pid, signum)         — 向进程发送信号（POSIX）
 *
 *   注意：信号处理函数中只能使用"异步信号安全"的函数
 *
 * 编译方法：
 *   gcc 01_signal_handling.c -o 01_signal_handling
 * 运行后按 Ctrl+C 查看效果
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <signal.h>   // signal, raise, SIG_*
#include <stdlib.h>   // exit, abort
#include <unistd.h>   // sleep (POSIX), Windows 用 Sleep
#include <stdbool.h>

#ifdef _WIN32
    #include <windows.h>
    #define sleep(x) Sleep((x) * 1000)
#endif

// ========== 1. 基本信号处理 ==========
/*
 * 信号处理函数（信号处理器）
 * 参数：收到的信号编号
 * 注意：处理函数应尽量简单！
 */
volatile sig_atomic_t interrupt_count = 0;
// sig_atomic_t 是原子访问的整数类型，用于信号处理

void signal_handler(int signum) {
    // 在信号处理函数中只能调用"异步信号安全"的函数
    // write() 是安全的，printf() 不安全！
    // 这里用 write 输出到 stderr
    const char *msg;
    size_t len;

    switch (signum) {
        case SIGINT:
            msg = "\n[信号] 收到 SIGINT (Ctrl+C)\n";
            len = strlen(msg);
            write(STDERR_FILENO, msg, len);
            interrupt_count++;
            if (interrupt_count >= 3) {
                msg = "收到 3 次中断，退出...\n";
                len = strlen(msg);
                write(STDERR_FILENO, msg, len);
                exit(1);
            }
            break;
        case SIGTERM:
            msg = "\n[信号] 收到 SIGTERM，清理退出\n";
            len = strlen(msg);
            write(STDERR_FILENO, msg, len);
            exit(0);
            break;
    }
    (void)signum;  // 抑制未使用参数警告
}

// ========== 2. 忽略信号 ==========
void ignore_signal_demo(void) {
    printf("\n--- 忽略信号 ---\n");
    printf("SIGINT (Ctrl+C) 将被临时忽略\n");

    // 设置 SIGINT 的处理方式为忽略
    void (*old_handler)(int) = signal(SIGINT, SIG_IGN);
    if (old_handler == SIG_ERR) {
        perror("signal");
        return;
    }

    printf("SIGINT 已被忽略 (按 Ctrl+C 无效)\n");
    sleep(1);

    // 恢复默认处理
    signal(SIGINT, SIG_DFL);
    printf("SIGINT 已恢复默认处理\n");
}

// ========== 3. 发送信号：raise() ==========
void raise_demo(void) {
    printf("\n--- raise() 发送信号 ---\n");

    printf("向自己发送 SIGTERM (模拟终止请求)...\n");
    raise(SIGTERM);

    printf("向自己发送 SIGINT (模拟中断)...\n");
    raise(SIGINT);
}

// ========== 4. SIGFPE 浮点异常 ==========
void sigfpe_handler(int signum) {
    (void)signum;
    const char *msg = "\n[信号] 浮点异常 (SIGFPE)!\n";
    write(STDERR_FILENO, msg, strlen(msg));
    exit(1);
}

void fpe_demo(void) {
    printf("\n--- SIGFPE 浮点异常 ---\n");
    signal(SIGFPE, sigfpe_handler);

    // 触发除零错误
    printf("即将触发除零...\n");
    printf("(已注释除零代码，避免崩溃)\n");
}

// ========== 5. SIGSEGV 段错误 ==========
void sigsegv_handler(int signum) {
    (void)signum;
    const char *msg =
        "\n[信号] 段错误 (SIGSEGV)! 非法内存访问\n";
    write(STDERR_FILENO, msg, strlen(msg));
    exit(1);
}

void segv_demo(void) {
    printf("\n--- SIGSEGV 段错误 ---\n");
    signal(SIGSEGV, sigsegv_handler);

    // 触发段错误
    printf("即将访问无效内存...\n");
    printf("(已注释段错误代码)\n");
}

// ========== 6. SIGABRT ==========
void sigabrt_handler(int signum) {
    (void)signum;
    const char *msg =
        "\n[信号] SIGABRT! abort() 被调用\n";
    write(STDERR_FILENO, msg, strlen(msg));
    // 注意：在 SIGABRT 处理器中不要 exit()
    // 否则可能无限循环
    _exit(1);
}

void abort_demo(void) {
    printf("\n--- SIGABRT / abort() ---\n");
    signal(SIGABRT, sigabrt_handler);

    printf("即将调用 abort()...\n");
    printf("(已注释 abort() 代码)\n");
}

// ========== 7. SIGALRM + alarm() ==========
/*
 * alarm(seconds) 在指定秒数后发送 SIGALRM
 * 注意：alarm() 是 POSIX 函数，Windows 不支持
 */
void sigalrm_handler(int signum) {
    (void)signum;
    const char *msg = "\n[信号] 定时器到期!\n";
    write(STDERR_FILENO, msg, strlen(msg));
}

void alarm_demo(void) {
    printf("\n--- SIGALRM 定时器 ---\n");

#ifdef _WIN32
    printf("alarm() 是 POSIX 函数，Windows 不支持\n");
    printf("可使用 Windows 的 SetTimer / WaitableTimer\n");
#else
    signal(SIGALRM, sigalrm_handler);

    printf("设置 2 秒定时器...\n");
    alarm(2);  // 2 秒后发送 SIGALRM

    // 等待
    sleep(3);
    printf("定时器演示结束\n");
#endif
}

// ========== 8. 一次性信号处理 ==========
/*
 * 某些系统支持 signal() 一次性处理：
 * 收到信号后恢复默认处理，需要重新注册。
 */
void one_shot_handler(int signum) {
    (void)signum;
    const char *msg =
        "\n[一次性处理] 这个处理器只生效一次\n";
    write(STDERR_FILENO, msg, strlen(msg));
}

// ========== main ==========
int main(int argc, char *argv[]) {
    printf("===== 信号处理 <signal.h> =====\n");
    printf("按 Ctrl+C 触发 SIGINT（按 3 次退出）\n\n");

    // 注册 SIGINT 和 SIGTERM 的处理器
    signal(SIGINT,  signal_handler);
    signal(SIGTERM, signal_handler);

    // 演示多种信号处理
    if (argc > 1) {
        // 带参数运行时可选择演示模式
        int mode = atoi(argv[1]);
        switch (mode) {
            case 1: fpe_demo(); return 0;
            case 2: segv_demo(); return 0;
            case 3: abort_demo(); return 0;
            case 4: alarm_demo(); return 0;
        }
    }

    // 主循环（等待信号）
    printf("程序运行中\n");
    printf("可以:\n");
    printf("  1. 按 Ctrl+C 发送 SIGINT\n");
#ifdef _WIN32
    printf("  2. 等待 5 秒自动结束演示\n");
#else
    printf("  2. 打开另一个终端: kill -TERM %d\n", getpid());
#endif
    printf("  3. 等待 5 秒自动结束演示\n");
    printf("--------------------------------\n");

    // 简单的交互式演示
    alarm_demo();
    ignore_signal_demo();

    // 等待几秒让用户测试 Ctrl+C
    int countdown = 5;
    while (countdown > 0 && interrupt_count < 3) {
        printf("\r等待 %d 秒... (Ctrl+C 测试)", countdown--);
        fflush(stdout);
        sleep(1);
    }
    printf("\n\n演示结束\n");

    // 恢复默认处理
    signal(SIGINT, SIG_DFL);

    // 信号安全总结
    printf("\n===== 信号安全总结 =====\n");
    printf("信号处理函数中安全可调用的函数:\n");
    printf("  write()  read()   _exit()  getpid()\n");
    printf("  signal() raise()  sleep()\n");
    printf("不安全（不要调用）:\n");
    printf("  printf() sprintf() malloc() free()\n");
    printf("  exit()  （推荐用 _exit()）\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. signal(signum, handler) 注册信号处理器
 * 2. SIG_IGN 忽略信号，SIG_DFL 恢复默认处理
 * 3. raise(signum) 向自己发送信号
 * 4. 信号处理器必须尽量简单，只调用 async-signal-safe 函数
 * 5. volatile sig_atomic_t 用于跨信号变量的原子访问
 * 6. POSIX 的 sigaction() 比 signal() 更可靠
 * 7. Windows 信号支持有限，建议用结构化异常处理(SEH)
 * ============================================
 */
