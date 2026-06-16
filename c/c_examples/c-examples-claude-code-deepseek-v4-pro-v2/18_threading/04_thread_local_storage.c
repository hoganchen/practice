/**
 * ============================================================================
 * 知识要点: 线程局部存储 (Thread-Local Storage) — C11 引入
 * ============================================================================
 *
 * 编译指令: gcc 04_thread_local_storage.c -o 04_thread_local_storage.exe -std=c11 -Wall -lpthread
 * 运行指令: ./04_thread_local_storage.exe
 *
 * 知识点概述:
 *   线程局部存储（TLS）允许每个线程拥有自己的变量副本。
 *   每个线程对 TLS 变量的修改不会影响其他线程的同名变量。
 *
 * 声明方式:
 *   - _Thread_local : C11 标准关键字
 *   - thread_local   : <threads.h> 中定义的宏，展开为 _Thread_local
 *   - __declspec(thread) : MSVC 专用语法
 *
 * 核心特性:
 *   - 每个线程独立初始化一次
 *   - 线程结束时自动销毁（如果是动态分配的需手动释放）
 *   - 静态初始化（编译时）和动态初始化（线程创建时）
 *   - 可用于全局变量、static 局部变量
 *
 * 适用场景:
 *   - 线程 ID 或名称
 *   - 每线程的错误码（类似 errno）
 *   - 每线程的缓存或池
 *   - 每线程的随机数种子
 *   - 日志上下文（如请求 ID 跟踪）
 * ============================================================================
 */

#include "../common/charset.h"
#include <stdio.h>      /* printf */
#include <stdlib.h>     /* malloc, free */
#include <string.h>     /* strcpy, strdup */
#include <pthread.h>    /* pthread_create, pthread_join, pthread_self */
#include <time.h>       /* time, nanosleep */
#include <unistd.h>     /* sleep (仅用于演示) */

/* ============================================================================
 * 示例 1: 基本 TLS — 每线程的计数器
 *
 * 声明方式: 在全局或 static 变量前加 _Thread_local
 * 这里每个线程都有自己独立的 counter 变量
 * ============================================================================
 */

/* 线程局部变量: 每线程调用计数器
 * 每个线程独立计数，互不影响
 */
static _Thread_local int tls_call_count = 0;

/* 线程局部变量: 线程名称
 * 每个线程可以存储自己的名称
 */
static _Thread_local const char *tls_thread_name = "unnamed";

/* ============================================================================
 * 示例 2: 线程 ID 自动分配器
 *
 * 使用 TLS 为每个线程分配一个递增的 ID
 * ============================================================================
 */

/* TLS: 每线程的自增 ID（自动分配）*/
static _Thread_local int tls_thread_id = -1;

/* 全局原子变量（用于分配 ID，非原子演示——为了简化只用一个线程演示）
 * 实际多线程中应使用 atomic_int
 */
static volatile int g_next_thread_id = 1;

/* 线程创建时调用此函数分配 ID */
void assign_thread_id(void)
{
    if (tls_thread_id == -1) {
        tls_thread_id = g_next_thread_id++;
    }
}

/* 获取当前线程的 ID */
int get_thread_id(void)
{
    return tls_thread_id;
}

/* ============================================================================
 * 示例 3: TLS + 函数调用计数
 *
 * 每线程统计某个函数被调用的次数
 * ============================================================================
 */

void some_function(void)
{
    /* 增加当前线程的调用计数 */
    tls_call_count++;
    printf("  [线程 %d] some_function 被调用了 %d 次\n",
           tls_thread_id, tls_call_count);
}

/* ============================================================================
 * 示例 4: TLS 错误码（类似 errno 的线程安全版本）
 *
 * 传统的 errno 在 C11 前可能不是线程安全的
 * 现在 errno 本身就是线程局部的（通过 TLS 实现）
 * ============================================================================
 */

/* TLS 错误码 */
static _Thread_local int tls_error_code = 0;
static _Thread_local char tls_error_message[256] = "";

/* 设置当前线程的错误 */
void tls_set_error(int code, const char *message)
{
    tls_error_code = code;
    strncpy(tls_error_message, message, sizeof(tls_error_message) - 1);
    tls_error_message[sizeof(tls_error_message) - 1] = '\0';
}

/* 获取当前线程的错误码 */
int tls_get_error(void)
{
    return tls_error_code;
}

/* 获取当前线程的错误消息 */
const char* tls_get_error_message(void)
{
    return tls_error_message;
}

/* ============================================================================
 * 示例 5: TLS 用于每线程的随机数种子
 *
 * 每个线程使用不同的随机种子，避免锁竞争
 * ============================================================================
 */

/* TLS 随机种子 */
static _Thread_local unsigned int tls_random_seed = 0;

/* 向前声明 */
int tls_rand(void);

/* 初始化每线程的随机种子 */
void tls_init_random(void)
{
    /* 用线程 ID 和当前时间来生成唯一种子 */
    tls_random_seed = (unsigned int)time(NULL) ^ (unsigned int)pthread_self();
    /* 跳过前几个伪随机数来提高质量 */
    tls_rand();
    tls_rand();
}

/* 获取一个线程安全的随机数
 * 使用简单的 LCG (Linear Congruential Generator) 算法
 * 公式: seed = seed * 1103515245 + 12345
 * 这里不依赖 POSIX 的 rand_r，跨平台兼容
 */
int tls_rand(void)
{
    if (tls_random_seed == 0) {
        tls_init_random();  /* 首次调用自动初始化 */
    }
    /* glibc 风格的 LCG 实现 */
    tls_random_seed = tls_random_seed * 1103515245U + 12345U;
    return (int)((tls_random_seed / 65536U) % 32768U);
}

/* ============================================================================
 * 示例 6: TLS 动态分配内存（需要在线程退出时清理）
 *
 * TLS 可以存储指针，指向线程退出时需释放的动态内存
 * 注意: _Thread_local 变量在线程结束时不会自动调用 free
 * 需要在线程函数末尾或通过 pthread 清理函数释放
 * ============================================================================
 */

/* TLS 指针 — 指向每个线程独有的缓冲区 */
static _Thread_local char *tls_buffer = NULL;

/* 获取每线程的缓冲区（懒分配）*/
char* tls_get_buffer(size_t size)
{
    if (tls_buffer == NULL) {
        tls_buffer = (char*)malloc(size);
        if (tls_buffer != NULL) {
            memset(tls_buffer, 0, size);
            /* 设置线程退出时的清理函数替代方案：
             * 使用 pthread_key_create 的析构函数
             * 但这里简单起见，在线程函数中手动释放 */
        }
    }
    return tls_buffer;
}

/* ============================================================================
 * 线程工作函数
 * ============================================================================
 */

void* thread_worker_a(void *arg)
{
    (void)arg;

    /* 分配线程 ID */
    assign_thread_id();
    printf("\n线程 A (TLS ID=%d) 启动\n", get_thread_id());

    /* 设置线程名称 */
    tls_thread_name = "Worker-A";

    /* 初始化随机数种子 */
    tls_init_random();

    /* 演示: 线程计数器不会相互干扰 */
    some_function();
    some_function();
    some_function();

    /* 演示: 每线程错误码 */
    printf("  [线程 %d] 设置错误码 5, msg=文件未找到\n", get_thread_id());
    tls_set_error(5, "文件未找到");
    printf("  [线程 %d] 错误码=%d, 消息=%s\n",
           get_thread_id(), tls_get_error(), tls_get_error_message());

    /* 演示: 每线程随机数 */
    printf("  [线程 %d] 随机数: %d %d %d\n",
           get_thread_id(), tls_rand(), tls_rand(), tls_rand());

    /* 演示: TLS 缓冲区 */
    char *buf = tls_get_buffer(128);
    if (buf) {
        snprintf(buf, 128, "这是线程 %d 的独有数据", get_thread_id());
        printf("  [线程 %d] 缓冲区内容: %s\n", get_thread_id(), buf);
    }

    /* 释放动态分配的 TLS 缓冲区 */
    free(tls_buffer);
    tls_buffer = NULL;

    printf("线程 A (TLS ID=%d) 结束\n", get_thread_id());
    return NULL;
}

void* thread_worker_b(void *arg)
{
    (void)arg;

    /* 分配线程 ID */
    assign_thread_id();
    printf("\n线程 B (TLS ID=%d) 启动\n", get_thread_id());

    /* 设置线程名称 */
    tls_thread_name = "Worker-B";

    /* 初始化随机数种子 */
    tls_init_random();

    /* 演示: 即使线程 A 调用了 3 次 some_function
     * 线程 B 的 TLS 调用计数从 0 开始 */
    some_function();
    some_function();

    /* 演示: 线程 B 的错误码不影响线程 A */
    printf("  [线程 %d] 设置错误码 0, msg=成功\n", get_thread_id());
    tls_set_error(0, "成功");
    printf("  [线程 %d] 错误码=%d, 消息=%s\n",
           get_thread_id(), tls_get_error(), tls_get_error_message());

    /* 演示: 每线程随机数（种子不同，序列不同）*/
    printf("  [线程 %d] 随机数: %d %d %d\n",
           get_thread_id(), tls_rand(), tls_rand(), tls_rand());

    /* 演示: TLS 缓冲区 */
    char *buf = tls_get_buffer(128);
    if (buf) {
        snprintf(buf, 128, "线程 %d 的私有数据——不与线程 A 共享", get_thread_id());
        printf("  [线程 %d] 缓冲区内容: %s\n", get_thread_id(), buf);
    }

    /* 释放动态分配的 TLS 缓冲区 */
    free(tls_buffer);
    tls_buffer = NULL;

    printf("线程 B (TLS ID=%d) 结束\n", get_thread_id());
    return NULL;
}

/* ============================================================================
 * 补充演示: TLS 与普通全局变量的对比
 *
 * 还有两个线程用来演示普通全局变量（共享）vs TLS（独立）
 * ============================================================================
 */

/* 普通全局变量（所有线程共享同一个副本）*/
static int g_shared_counter = 0;

/* TLS 变量（每个线程拥有自己的副本）*/
static _Thread_local int tls_private_counter = 0;

void* thread_compare(void *arg)
{
    (void)arg;

    printf("\n  [对比线程] 启动\n");

    /* 修改全局变量 */
    g_shared_counter++;
    printf("  [对比线程] 全局共享计数器 = %d (所有线程看到的值会叠加)\n",
           g_shared_counter);

    /* 修改 TLS 变量 */
    tls_private_counter++;
    printf("  [对比线程] TLS 私有计数器 = %d (每个线程独立, 始终为 1)\n",
           tls_private_counter);

    /* TLS 变量的地址也与其他线程不同 */
    printf("  [对比线程] TLS 变量地址: %p\n", (void*)&tls_private_counter);

    return NULL;
}

/* ============================================================================
 * 主函数
 * ============================================================================
 */
int main(void)
{
    pthread_t tids[4];
    int ret;

    printf("============================================\n");
    printf("  线程局部存储 (Thread-Local Storage) 示例\n");
    printf("============================================\n");

    /* ----------------------------------------------------------------
     * 示例 1-5: 多线程 TLS 演示
     * ---------------------------------------------------------------- */
    printf("\n====== 多线程 TLS 演示 ======\n");
    printf("创建 2 个工作线程，每个使用各自的 TLS 变量\n");
    printf("注意: 各线程的调用计数、错误码、随机数互不影响\n");

    ret = pthread_create(&tids[0], NULL, thread_worker_a, NULL);
    if (ret != 0) { fprintf(stderr, "创建线程失败\n"); return 1; }

    ret = pthread_create(&tids[1], NULL, thread_worker_b, NULL);
    if (ret != 0) { fprintf(stderr, "创建线程失败\n"); return 1; }

    pthread_join(tids[0], NULL);
    pthread_join(tids[1], NULL);

    /* ----------------------------------------------------------------
     * 示例 6: 对比全局变量 vs TLS
     * ---------------------------------------------------------------- */
    printf("\n====== 全局变量 vs TLS 对比演示 ======\n");

    ret = pthread_create(&tids[0], NULL, thread_compare, NULL);
    if (ret != 0) { fprintf(stderr, "创建线程失败\n"); return 1; }

    ret = pthread_create(&tids[1], NULL, thread_compare, NULL);
    if (ret != 0) { fprintf(stderr, "创建线程失败\n"); return 1; }

    pthread_join(tids[0], NULL);
    pthread_join(tids[1], NULL);

    /* 从主线程观察最终值 */
    printf("\n  [主线程] 最终状态:\n");
    printf("  [主线程] 全局共享计数器 = %d\n", g_shared_counter);
    /* 主线程的 TLS 变量是独立的 */
    printf("  [主线程] TLS 私有计数器 = %d (主线程自己的副本)\n",
           tls_private_counter);

    /* ----------------------------------------------------------------
     * 补充说明: TLS 初始化
     * ---------------------------------------------------------------- */
    printf("\n====== 补充: TLS 初始化时机 ======\n");
    printf("  TLS 变量在每个线程首次创建时初始化\n");
    printf("  静态 TLS 变量（如 tls_call_count=0）在线程启动时初始化\n");
    printf("  动态 TLS 变量（如指针指向 malloc 的内存）需在线程函数中手动管理\n");

    printf("\n============================================\n");
    printf("  程序运行完毕\n");
    printf("============================================\n");

    return 0;
}

/* ============================================================================
 * 最佳实践总结:
 *
 * 1. 什么时候使用线程局部存储?
 *    - 数据天然是每线程的（如线程 ID、错误码、日志上下文）
 *    - 想避免锁竞争（每个线程操作自己的副本）
 *    - 需要线程安全的全局状态，但不需要在线程间共享
 *
 * 2. TLS 的局限性:
 *    - 每个 TLS 变量占用额外的内存（每线程一份）
 *    - 线程数量很多时，TLS 变量消耗大量内存
 *    - 动态分配的 TLS 内存需要在线程退出时手动释放
 *    - 不能通过 TLS 在线程间传递数据（这正是 TLS 的目的）
 *
 * 3. 注意事项:
 *    - _Thread_local 只能用于文件作用域或块作用域的 static 变量
 *    - 不能用于函数参数或函数返回值类型
 *    - 动态分配的 TLS 缓冲区必须在线程退出前 free
 *    - 大型数据结构放在 TLS 中要谨慎（栈空间有限）
 *    - 某些平台对 TLS 变量数量有限制
 *    - 在 C++ 中对应 thread_local 关键字（C++11 起）
 *
 * 4. 替代方案:
 *    - pthread 的 pthread_key_create 和 pthread_setspecific/getspecific
 *    - __declspec(thread) (MSVC)
 *    - __thread (GCC 旧语法，GCC 3.3+ 支持，_Thread_local 的前身)
 *    C11 的 _Thread_local 是标准化方案，优先使用
 * ============================================================================
 */
