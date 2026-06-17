/**
 * ============================================================================
 * 知识要点: 线程补充知识点合集
 * ============================================================================
 *
 * 编译指令: gcc 09_thread_misc.c -o 09_thread_misc.exe -std=c11 -Wall -lpthread
 * 运行指令: ./09_thread_misc.exe
 *
 * 本文件涵盖以下知识点的示例:
 *
 *   1. pthread_cancel          — 线程取消（请求终止其他线程）
 *   2. pthread_cleanup_push/pop — 线程清理函数（确保资源释放）
 *   3. pthread_once             — 一次性初始化（线程安全的单次执行）
 *   4. pthread_equal            — 比较线程 ID
 *   5. pthread_barrier_t        — 屏障（多线程同步汇合点）
 *   6. pthread_key_create       — pthread 风格的线程局部存储（动态 TLS）
 * ============================================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <string.h>
#include <errno.h>

#ifdef _WIN32
#include <windows.h>
#define SLEEP_MS(ms) Sleep(ms)
#else
#include <unistd.h>
#define SLEEP_MS(ms) usleep((ms) * 1000)
#endif

/* ============================================================================
 * 知识点 1: pthread_cancel — 线程取消
 *
 * 一个线程请求终止另一个线程。
 * 取消有延迟和异步两种模式，默认是延迟取消。
 *
 * 核心 API:
 *   - pthread_cancel(tid)        : 发送取消请求
 *   - pthread_setcancelstate()   : 启用/禁用取消
 *   - pthread_setcanceltype()    : 设置取消类型（延迟/异步）
 *   - pthread_testcancel()       : 设置取消点
 *
 * 取消点 (Cancellation Point):
 *   线程只在"取消点"检查是否有取消请求。常见的取消点函数：
 *   文件: read, write, open, close, fopen, fclose
 *     I/O: printf, scanf, getc, putc
 *    同步: pthread_cond_wait, pthread_join, pthread_testcancel
 *    睡眠: sleep, nanosleep
 * ============================================================================
 */

/* 取消标志（用于跟踪线程被取消后的行为）*/
static pthread_mutex_t g_cancel_log_lock = PTHREAD_MUTEX_INITIALIZER;

static void log_cancel(const char *msg)
{
    pthread_mutex_lock(&g_cancel_log_lock);
    printf("  %s\n", msg);
    pthread_mutex_unlock(&g_cancel_log_lock);
}

/* 工作线程：可以被取消 */
static void* cancellable_worker(void *arg)
{
    (void)arg;
    int count = 0;

    log_cancel("[工作线程] 启动，开始循环...");

    while (1) {
        count++;
        /* printf 是取消点，线程在这里检查是否有取消请求 */
        if (count % 10000000 == 0) {
            printf("  [工作线程] 迭代 %d 千万次...\n", count / 10000000);
        }

        /* 显式设置取消点（即使没有 IO 操作）*/
        if (count % 5000000 == 0) {
            pthread_testcancel();
        }
    }

    /* 不会执行到这里 */
    return NULL;
}

/* 不可取消的工作线程 */
static void* uncancellable_worker(void *arg)
{
    (void)arg;

    /* 禁用取消 */
    int old_state;
    pthread_setcancelstate(PTHREAD_CANCEL_DISABLE, &old_state);
    log_cancel("[不可取消线程] 已禁用取消，开始重要操作...");

    /* 模拟不可中断的重要操作 */
    SLEEP_MS(1500);
    log_cancel("[不可取消线程] 重要操作完成");

    /* 重新启用取消 */
    pthread_setcancelstate(PTHREAD_CANCEL_ENABLE, &old_state);
    log_cancel("[不可取消线程] 重新启用取消，进入可取消区域");

    /* 进入可取消区域，设置取消点 */
    SLEEP_MS(2000);
    log_cancel("[不可取消线程] 结束");
    return NULL;
}

void demo_cancel(void)
{
    printf("====== 1. pthread_cancel 线程取消 ======\n\n");

    pthread_t t;

    /* 演示：取消工作线程 */
    printf("--- 取消工作线程 ---\n");
    pthread_create(&t, NULL, cancellable_worker, NULL);
    SLEEP_MS(500);

    printf("  主线程: 发送取消请求...\n");
    pthread_cancel(t);
    pthread_join(t, NULL);
    printf("  ✅ 工作线程已取消\n\n");

    /* 演示：不可取消的线程 */
    printf("--- 取消被禁用的线程 ---\n");
    pthread_create(&t, NULL, uncancellable_worker, NULL);
    SLEEP_MS(100);

    printf("  主线程: 发送取消请求...\n");
    pthread_cancel(t);  /* 此时线程处于 DISABLE 状态，取消被挂起 */
    printf("  主线程: 取消请求已发送 (但线程仍在执行)\n");
    pthread_join(t, NULL);
    printf("  ✅ 不可取消线程已完成\n\n");
}

/* ============================================================================
 * 知识点 2: pthread_cleanup_push/pop — 线程清理函数
 *
 * 当线程被取消或提前退出时，确保资源被释放。
 * 类似 C++ 的 RAII，或 Java 的 finally 块。
 *
 * 清理函数的触发时机:
 *   - 线程被取消 (pthread_cancel)
 *   - 线程调用 pthread_exit
 *   - 正常 return 时（如果 pop 参数为非 0）
 *
 * 注意: push 和 pop 必须成对出现（同一个词法作用域内）
 * ============================================================================
 */

static pthread_mutex_t g_cleanup_mutex = PTHREAD_MUTEX_INITIALIZER;
static int *g_shared_resource = NULL;
static int g_cleanup_executed = 0;

/* 清理函数 */
static void resource_cleanup(void *arg)
{
    const char *msg = (const char *)arg;
    g_cleanup_executed = 1;

    pthread_mutex_lock(&g_cleanup_mutex);
    if (g_shared_resource != NULL) {
        printf("  [清理] %s — 释放资源 g_shared_resource\n", msg);
        free(g_shared_resource);
        g_shared_resource = NULL;
    }
    printf("  [清理] %s — 清理完成\n", msg);
    pthread_mutex_unlock(&g_cleanup_mutex);
}

/* 被取消时会触发清理 */
static void* cleanup_test_thread(void *arg)
{
    (void)arg;

    /* 分配资源 */
    g_shared_resource = malloc(1024);
    printf("  [线程] 分配了资源\n");

    /* 注册清理函数 */
    pthread_cleanup_push(resource_cleanup, "取消触发清理");

    /* 进入可取消区域 */
    while (1) {
        pthread_testcancel();
    }

    /*
     * pop 参数:
     *   0  = 不执行清理函数（仅注销），return 时资源泄漏
     *   非0 = 执行清理函数
     * 这里永远不会执行到（因为上面的死循环），但语法上必须配对
     */
    pthread_cleanup_pop(0);

    return NULL;
}

void demo_cleanup(void)
{
    printf("====== 2. pthread_cleanup_push/pop 线程清理 ======\n\n");

    g_cleanup_executed = 0;

    pthread_t t;
    pthread_create(&t, NULL, cleanup_test_thread, NULL);
    SLEEP_MS(200);

    printf("  主线程: 取消线程...\n");
    pthread_cancel(t);
    pthread_join(t, NULL);

    printf("  清理是否执行: %s\n\n", g_cleanup_executed ? "✅ 是" : "❌ 否");
}

/* ============================================================================
 * 知识点 3: pthread_once — 一次性初始化
 *
 * 保证某个初始化函数在多线程环境中只被执行一次。
 * 即使多个线程同时调用 pthread_once，初始化函数也只运行一次。
 *
 * 适用场景:
 *   - 单例模式
 *   - 全局配置的懒加载
 *   - 模块初始化（线程安全的）
 * ============================================================================
 */

static pthread_once_t g_once_control = PTHREAD_ONCE_INIT;
static int g_initialized = 0;

static void global_init(void)
{
    printf("  [全局初始化] 运行一次！(由线程 %lu 执行)\n",
           (unsigned long)pthread_self());
    g_initialized = 1;
    SLEEP_MS(100);  /* 模拟初始化耗时 */
}

static void* once_demo_thread(void *arg)
{
    int id = *(int *)arg;

    printf("  [线程 %d] 尝试调用 pthread_once...\n", id);
    pthread_once(&g_once_control, global_init);
    printf("  [线程 %d] pthread_once 返回 (已初始化=%d)\n",
           id, g_initialized);

    return NULL;
}

void demo_once(void)
{
    printf("====== 3. pthread_once 一次性初始化 ======\n\n");

    pthread_t threads[5];
    int ids[5];

    for (int i = 0; i < 5; i++) {
        ids[i] = i + 1;
        pthread_create(&threads[i], NULL, once_demo_thread, &ids[i]);
    }
    for (int i = 0; i < 5; i++) {
        pthread_join(threads[i], NULL);
    }

    printf("  ✅ 初始化函数仅执行一次 (g_initialized = %d)\n\n", g_initialized);
}

/* ============================================================================
 * 知识点 4: pthread_equal — 比较线程 ID
 *
 * pthread_t 是抽象类型，不一定是整数（可能是结构体）。
 * 不能直接用 == 比较，必须用 pthread_equal。
 * ============================================================================
 */

void demo_equal(void)
{
    printf("====== 4. pthread_equal 比较线程 ID ======\n\n");

    pthread_t t1, t2;
    pthread_create(&t1, NULL, cancellable_worker, NULL);
    pthread_create(&t2, NULL, cancellable_worker, NULL);

    SLEEP_MS(100);

    /* 取消两个线程并等待结束 */
    pthread_cancel(t1);
    pthread_cancel(t2);
    pthread_join(t1, NULL);
    pthread_join(t2, NULL);

    int equal = pthread_equal(t1, t2);
    printf("  pthread_equal(t1, t2) = %d (0=不同, 非0=相同)\n", equal);

    int self_equal = pthread_equal(t1, t1);
    printf("  pthread_equal(t1, t1) = %d (自身比较)\n\n", self_equal);

    printf("  注意: pthread_t 是抽象类型，不能直接用 == 比较！\n\n");
}

/* ============================================================================
 * 知识点 5: pthread_barrier_t — 屏障
 *
 * 屏障是多个线程的"汇合点"：
 *   所有线程到达屏障后才能一起继续执行。
 *   常用于并行算法的分阶段同步。
 *
 * 核心 API:
 *   - pthread_barrier_init(&barrier, NULL, count) : 初始化屏障
 *   - pthread_barrier_wait(&barrier)              : 等待所有线程到达
 *   - pthread_barrier_destroy(&barrier)           : 销毁屏障
 *
 * 与条件变量 broadcast 的区别:
 *   屏障可以复用到多个阶段，条件变量需要重置条件。
 * ============================================================================
 */

#define BARRIER_THREADS 4
#define BARRIER_PHASES 3

static pthread_barrier_t g_barrier;
static pthread_mutex_t g_barrier_print = PTHREAD_MUTEX_INITIALIZER;

static void barrier_printf(const char *fmt, int v1, int v2)
{
    pthread_mutex_lock(&g_barrier_print);
    printf(fmt, v1, v2);
    pthread_mutex_unlock(&g_barrier_print);
}

static void* barrier_worker(void *arg)
{
    int id = *(int *)arg;

    for (int phase = 1; phase <= BARRIER_PHASES; phase++) {
        /* 模拟不同步的工作（各线程耗时不同）*/
        SLEEP_MS(100 * id);

        barrier_printf("  [工作线程 %d] 阶段 %d 完成，等待其他线程...\n", id, phase);

        /* 等待所有线程到达屏障 */
        int ret = pthread_barrier_wait(&g_barrier);

        if (ret == PTHREAD_BARRIER_SERIAL_THREAD) {
            barrier_printf(
                "  >>> 线程 %d 是最后一个到达屏障的线程 (SERIAL_THREAD) <<<\n",
                id, 0);
        }

        barrier_printf("  [工作线程 %d] 进入阶段 %d\n", id, phase + 1);
    }

    return NULL;
}

void demo_barrier(void)
{
    printf("====== 5. pthread_barrier_t 屏障 ======\n\n");
    printf("  %d 个线程，%d 个阶段的多阶段同步\n\n",
           BARRIER_THREADS, BARRIER_PHASES);

    /* 初始化屏障（需要 BARRIER_THREADS 个线程都到达才放行）*/
    pthread_barrier_init(&g_barrier, NULL, BARRIER_THREADS);

    pthread_t threads[BARRIER_THREADS];
    int ids[BARRIER_THREADS];

    for (int i = 0; i < BARRIER_THREADS; i++) {
        ids[i] = i + 1;
        pthread_create(&threads[i], NULL, barrier_worker, &ids[i]);
    }
    for (int i = 0; i < BARRIER_THREADS; i++) {
        pthread_join(threads[i], NULL);
    }

    pthread_barrier_destroy(&g_barrier);

    printf("  ✅ 所有阶段完成\n\n");
}

/* ============================================================================
 * 知识点 6: pthread_key_create — pthread 风格的 TLS
 *
 * 除了 C11 的 _Thread_local，pthread 也提供了动态 TLS API：
 *   - pthread_key_create()   : 创建 TLS 键
 *   - pthread_setspecific()  : 设置线程私有数据
 *   - pthread_getspecific()  : 获取线程私有数据
 *   - pthread_key_delete()   : 删除 TLS 键
 *
 * 优势：可以在运行时动态创建、有析构函数自动清理。
 * 与 _Thread_local 对比:
 *   - _Thread_local: 编译时声明，简单高效
 *   - pthread_key:   运行时动态，支持析构函数，更灵活
 * ============================================================================
 */

/* TLS 键 */
static pthread_key_t g_tls_key;

/* TLS 析构函数（线程退出时自动调用）*/
static void tls_destructor(void *data)
{
    if (data != NULL) {
        printf("  [析构函数] 释放线程私有数据: %s\n", (char *)data);
        free(data);
    }
}

/* 线程函数：使用 pthread_key TLS */
static void* key_tls_worker(void *arg)
{
    int id = *(int *)arg;

    /* 分配线程私有的数据 */
    char *msg = malloc(64);
    snprintf(msg, 64, "线程 %d 的私有数据 (通过 pthread_key)", id);

    /* 存储到 TLS */
    pthread_setspecific(g_tls_key, msg);

    /* 获取并验证 */
    char *retrieved = (char *)pthread_getspecific(g_tls_key);
    printf("  [TLS线程 %d] 获取到: %s\n", id, retrieved);

    /* 注意：不需要手动 free，析构函数会自动处理 */
    return NULL;
}

void demo_key_tls(void)
{
    printf("====== 6. pthread_key_create 动态 TLS ======\n\n");

    /* 创建 TLS 键，注册析构函数 */
    pthread_key_create(&g_tls_key, tls_destructor);
    printf("  已创建 TLS 键，注册了析构函数\n\n");

    pthread_t threads[3];
    int ids[3];

    for (int i = 0; i < 3; i++) {
        ids[i] = i + 1;
        pthread_create(&threads[i], NULL, key_tls_worker, &ids[i]);
    }
    for (int i = 0; i < 3; i++) {
        pthread_join(threads[i], NULL);
    }

    /* 删除 TLS 键 */
    pthread_key_delete(g_tls_key);
    printf("\n  ✅ TLS 键已删除\n\n");
}

/* ============================================================================
 * 主函数
 * ============================================================================
 */
int main(void)
{
    setbuf(stdout, NULL);  /* 禁用 stdout 缓冲 */
    printf("============================================\n");
    printf("  线程补充知识点合集\n");
    printf("============================================\n\n");

    demo_cancel();
    demo_cleanup();
    demo_once();
    demo_equal();
    demo_barrier();
    demo_key_tls();

    /* ===== 总结对照表 ===== */
    printf("============================================\n");
    printf("  各知识点适用场景\n");
    printf("============================================\n\n");

    printf("pthread_cancel        — 需要终止其他线程时\n");
    printf("pthread_cleanup_push  — 需要确保资源在取消时的释放\n");
    printf("pthread_once          — 全局只初始化一次（线程安全）\n");
    printf("pthread_equal         — 比较两个线程 ID 是否相同\n");
    printf("pthread_barrier_t     — 多线程分阶段同步汇合\n");
    printf("pthread_key_create    — 适合运行时才需决定 TLS 的场景\n");

    printf("\n============================================\n");
    printf("  程序结束\n");
    printf("============================================\n");

    return 0;
}
