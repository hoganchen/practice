/**
 * ============================================================================
 * 知识要点: 线程属性 (pthread_attr_t)
 * ============================================================================
 *
 * 编译指令: gcc 06_thread_attributes.c -o 06_thread_attributes.exe -std=c11 -Wall -lpthread
 * 运行指令: ./06_thread_attributes.exe
 *
 * 知识点概述:
 *   pthread_create 的第二个参数是线程属性对象 pthread_attr_t。
 *   传 NULL 使用默认属性；需要自定义时，通过属性对象配置。
 *
 * 核心 API:
 *   - pthread_attr_init()           : 初始化属性对象
 *   - pthread_attr_destroy()        : 销毁属性对象
 *   - pthread_attr_setdetachstate() : 设置分离状态
 *   - pthread_attr_getdetachstate() : 获取分离状态
 *   - pthread_attr_setstacksize()   : 设置线程栈大小
 *   - pthread_attr_getstacksize()   : 获取线程栈大小
 *   - pthread_attr_setstackaddr()   : 设置自定义栈地址（极少用）
 *   - pthread_create(..., &attr)    : 用属性创建线程
 *   - pthread_detach()              : 运行时分离线程
 *
 * 分离状态 (Detach State):
 *   - PTHREAD_CREATE_JOINABLE  : 默认，可被 pthread_join 等待
 *   - PTHREAD_CREATE_DETACHED  : 分离，退出时自动释放资源
 *
 * 线程栈大小 (Stack Size):
 *   - 默认通常是 8MB，可通过 getstacksize 查询
 *   - 嵌入式或大量线程时需调小（如 64KB）
 *   - 深度递归时需调大（如 16MB）
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
 * 示例 1: 属性生命周期 + 获取默认值
 * ============================================================================
 */

void demo_attr_lifecycle(void)
{
    printf("----- 属性生命周期与默认值 -----\n");

    pthread_attr_t attr;

    /* ① 初始化属性对象 */
    int ret = pthread_attr_init(&attr);
    if (ret != 0) {
        fprintf(stderr, "pthread_attr_init 失败: %s\n", strerror(ret));
        return;
    }

    /* ② 查询默认分离状态 */
    int detach_state;
    pthread_attr_getdetachstate(&attr, &detach_state);
    printf("  默认分离状态: %s\n",
           detach_state == PTHREAD_CREATE_JOINABLE ? "JOINABLE (可被 join)" :
           detach_state == PTHREAD_CREATE_DETACHED ? "DETACHED (分离)" :
           "未知");

    /* ③ 查询默认栈大小 */
    size_t stack_size;
    pthread_attr_getstacksize(&attr, &stack_size);
    printf("  默认栈大小: %zu 字节 (%.2f MB)\n", stack_size, stack_size / 1024.0 / 1024.0);

    /* ④ 修改属性：设为分离状态，栈大小 256KB */
    pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED);
    pthread_attr_setstacksize(&attr, 256 * 1024);  /* 256 KB */

    /* ⑤ 用属性创建线程（示例 2 中演示）*/

    /* ⑥ 使用完毕后销毁 */
    pthread_attr_destroy(&attr);
    printf("  属性对象已销毁。\n\n");
}

/* ============================================================================
 * 示例 2: DETACHED 状态 — 线程自行清理
 *
 * 分离线程：不需要 pthread_join，退出时自动释放资源。
 * 适用于"fire-and-forget"（触发即忘）的后台任务。
 * ============================================================================
 */

static pthread_mutex_t g_detach_print_lock = PTHREAD_MUTEX_INITIALIZER;

static void detached_worker(int id, int work_ms)
{
    /* 模拟工作 */
    SLEEP_MS(work_ms);

    pthread_mutex_lock(&g_detach_print_lock);
    printf("  [分离线程 %d] 任务完成 (耗时 %d ms)\n", id, work_ms);
    pthread_mutex_unlock(&g_detach_print_lock);
}

/* 分离线程的包装函数（因为 pthread_create 要求 void* func(void*)）*/
static void* detached_worker_wrapper(void *arg)
{
    int id = *(int *)arg;
    free(arg);  /* 释放堆上分配的参数（创建线程时 malloc 的）*/

    int work_ms = (id + 1) * 300;
    detached_worker(id, work_ms);

    return NULL;  /* 返回值自动丢弃 */
}

void demo_detached_threads(void)
{
    printf("----- 分离线程 (DETACHED) -----\n");
    printf("  分离线程退出时自动释放资源，无需 pthread_join。\n\n");

    pthread_attr_t attr;
    pthread_attr_init(&attr);
    pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED);

    for (int i = 0; i < 4; i++) {
        /*
         * 注意：传递给分离线程的参数必须存活到线程使用完。
         * 这里用 malloc 在堆上分配，线程函数中 free。
         * 如果传局部变量的地址，主线程可能先退出导致地址失效。
         */
        int *arg = malloc(sizeof(int));
        *arg = i;

        pthread_t tid;
        int ret = pthread_create(&tid, &attr, detached_worker_wrapper, arg);
        if (ret != 0) {
            fprintf(stderr, "  创建分离线程 %d 失败: %s\n", i, strerror(ret));
            free(arg);
        } else {
            printf("  已创建分离线程 %d (不会 join 等待)\n", i);
        }
    }

    pthread_attr_destroy(&attr);

    /* 给分离线程一点时间完成（否则主线程退出后进程结束）*/
    printf("\n  主线程继续做其他事...\n");
    SLEEP_MS(200);

    /* 方式二：也可以用 pthread_detach 在运行时分离一个 joinable 线程
     * pthread_detach(tid);   // 将已创建的线程改为分离状态
     */
    printf("  主线程工作完成，等待分离线程执行...\n");
    SLEEP_MS(1500);  /* 等所有分离线程结束 */
    printf("  主线程退出。\n\n");
}

/* ============================================================================
 * 示例 3: 自定义栈大小
 *
 * 需要调小栈大小的场景：
 *   - 创建大量线程（如数千个），每个线程栈 8MB 会耗尽虚拟内存
 *   - 嵌入式系统内存有限
 *
 * 需要调大栈大小的场景：
 *   - 深度递归（如遍历极深的目录树）
 * ============================================================================
 */

/* 递归深度测试：用递归函数撑爆小栈 */
static int deep_recursion(int depth, int max_depth, int *counter)
{
    (*counter)++;
    if (depth >= max_depth) {
        return depth;
    }
    /* 在栈上分配缓冲区 - 每个递归帧占用一定栈空间 */
    char buf[512];
    (void)buf;  /* 防止编译器优化掉 */
    return deep_recursion(depth + 1, max_depth, counter);
}

typedef struct {
    int max_depth;
    int result;
    int count;
} RecursionArgs;

static void* recursion_worker(void *arg)
{
    RecursionArgs *a = (RecursionArgs *)arg;
    a->count = 0;
    a->result = deep_recursion(0, a->max_depth, &a->count);
    return NULL;
}

void demo_stack_size(void)
{
    printf("----- 自定义栈大小 -----\n");

    pthread_attr_t attr;
    pthread_attr_init(&attr);

    /* 设置较小栈 (128 KB) — 每个递归帧 ~600 字节，约能容纳 200 层 */
    size_t small_stack = 128 * 1024;
    pthread_attr_setstacksize(&attr, small_stack);

    size_t actual_stack;
    pthread_attr_getstacksize(&attr, &actual_stack);
    printf("  小栈设置: %zu KB (实际: %zu KB)\n",
           small_stack / 1024, actual_stack / 1024);

    RecursionArgs args = {.max_depth = 300, .result = 0, .count = 0};

    pthread_t tid;
    int ret = pthread_create(&tid, &attr, recursion_worker, &args);
    if (ret == 0) {
        pthread_join(tid, NULL);
        printf("  小栈线程 (128KB) — 递归深度 %d (共调用 %d 次)\n",
               args.result, args.count);
    } else {
        printf("  小栈线程创建失败: %s\n", strerror(ret));
    }

    /* 对比：用默认栈做同样的递归 */
    RecursionArgs args2 = {.max_depth = 300, .result = 0, .count = 0};
    ret = pthread_create(&tid, NULL, recursion_worker, &args2);
    if (ret == 0) {
        pthread_join(tid, NULL);
        printf("  默认栈线程 — 递归深度 %d (共调用 %d 次)\n",
               args2.result, args2.count);
    } else {
        printf("  默认栈线程创建失败: %s\n", strerror(ret));
    }

    printf("  注: 若递归深度 > 栈容量，线程会因栈溢出崩溃。\n");
    printf("      调大 pthread_attr_setstacksize 可应对深度递归。\n");

    pthread_attr_destroy(&attr);
    printf("\n");
}

/* ============================================================================
 * 示例 4: JOINABLE vs DETACHED 对比
 *
 * 验证：对已分离的线程调用 pthread_join 会返回 ESRCH
 * ============================================================================
 */

static void* quick_task(void *arg)
{
    (void)arg;
    return NULL;
}

void demo_join_detached(void)
{
    printf("----- JOINABLE vs DETACHED 对比 -----\n");

    pthread_t tid;

    /* 创建分离线程 */
    pthread_attr_t attr;
    pthread_attr_init(&attr);
    pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED);
    pthread_create(&tid, &attr, quick_task, NULL);
    pthread_attr_destroy(&attr);

    SLEEP_MS(50);  /* 确保线程已退出 */

    /* 尝试 join 已分离的线程 */
    int ret = pthread_join(tid, NULL);
    if (ret == ESRCH) {
        printf("  ✅ 已分离线程不可 join: 返回 ESRCH (预期行为)\n");
    } else if (ret == 0) {
        printf("  ❌ 意外: 分离线程可 join\n");
    } else {
        printf("  join 返回值: %s\n", strerror(ret));
    }

    /* 创建普通 joinable 线程 */
    pthread_create(&tid, NULL, quick_task, NULL);
    ret = pthread_join(tid, NULL);
    printf("  ✅ Joinable 线程可 join: %s\n", ret == 0 ? "成功" : strerror(ret));

    printf("\n");
}

/* ============================================================================
 * 主函数
 * ============================================================================
 */
int main(void)
{
    setbuf(stdout, NULL);  /* 禁用 stdout 缓冲，确保输出及时显示 */
    printf("============================================\n");
    printf("  线程属性 (pthread_attr_t) 示例\n");
    printf("============================================\n\n");

    demo_attr_lifecycle();
    demo_detached_threads();
    demo_stack_size();
    demo_join_detached();

    /* ===== 注意事项 ===== */
    printf("============================================\n");
    printf("  使用注意事项\n");
    printf("============================================\n\n");

    printf("1. 属性对象必须 init → use → destroy\n");
    printf("2. 分离线程必须在参数存活期内完成任务\n");
    printf("3. 设置栈大小后，系统可能向上取整到页大小的倍数\n");
    printf("4. 最小栈大小因系统而异（通常 16KB ~ 64KB）\n");
    printf("5. 自定义栈地址 (stackaddr) 兼容性差，避免使用\n");
    printf("6. 属性可复用：用同一 attr 创建多个相同属性的线程\n");
    printf("7. 一个属性同时配置多个特性：detach + stacksize 等\n");

    printf("\n============================================\n");
    printf("  程序结束\n");
    printf("============================================\n");

    return 0;
}
