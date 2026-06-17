/**
 * ============================================================================
 * 知识要点: 读写锁 (Read-Write Lock)
 * ============================================================================
 *
 * 编译指令: gcc 07_rwlock.c -o 07_rwlock.exe -std=c11 -Wall -lpthread
 * 运行指令: ./07_rwlock.exe
 *
 * 知识点概述:
 *   读写锁区分"读"与"写"两种操作模式：
 *   - 读锁 (共享锁) : 多个线程可以同时持有读锁
 *   - 写锁 (独占锁) : 写锁与其他锁（读或写）互斥
 *
 * 核心 API:
 *   - pthread_rwlock_t               : 读写锁类型
 *   - pthread_rwlock_init()          : 初始化
 *   - pthread_rwlock_destroy()       : 销毁
 *   - pthread_rwlock_rdlock()        : 获取读锁（共享）
 *   - pthread_rwlock_wrlock()        : 获取写锁（独占）
 *   - pthread_rwlock_unlock()        : 释放锁
 *   - pthread_rwlock_tryrdlock()     : 尝试获取读锁（非阻塞）
 *   - pthread_rwlock_trywrlock()     : 尝试获取写锁（非阻塞）
 *
 * 适用场景:
 *   - 读多写少的共享数据（配置表、缓存、词典）
 *   - 多个读者同时读取不会出错，但写者必须独占
 *
 * 性能对比:
 *   普通互斥锁: 10 个读者相互阻塞，只能串行
 *   读写锁:     10 个读者可以同时读取，写者等待
 * ============================================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <string.h>
#include <time.h>

#ifdef _WIN32
#include <windows.h>
#define SLEEP_MS(ms) Sleep(ms)
#else
#include <unistd.h>
#define SLEEP_MS(ms) usleep((ms) * 1000)
#endif

/* ============================================================================
 * 示例 1: 读多写少 — 共享缓存
 *
 * 模拟一个"文章缓存"：多个读者同时读取，偶尔有写者更新。
 * 对比：互斥锁（读者也互斥）vs 读写锁（读者不互斥）
 * ============================================================================
 */

#define CACHE_LINE_SIZE 256
#define NUM_READERS 5

/* 共享缓存 */
static char g_cache[][CACHE_LINE_SIZE] = {
    "初始数据: Hello World",
    "初始数据: Foo Bar",
    "初始数据: 12345"
};
static int g_cache_size = 3;

/* 读写锁 */
static pthread_rwlock_t g_rwlock;

/* 用于对比的普通互斥锁 */
static pthread_mutex_t g_mutex = PTHREAD_MUTEX_INITIALIZER;

/* 统计信息 */
static volatile int g_read_count_rw = 0;
static volatile int g_read_count_mutex = 0;
static int g_write_count = 0;

/* 读操作（用读写锁）*/
static void read_with_rwlock(int id)
{
    pthread_rwlock_rdlock(&g_rwlock);
    g_read_count_rw++;
    printf("  [读者 %d - RW锁] 读到: %s\n", id, g_cache[id % g_cache_size]);
    SLEEP_MS(50);  /* 模拟处理耗时 */
    pthread_rwlock_unlock(&g_rwlock);
}

/* 读操作（用普通互斥锁）*/
static void read_with_mutex(int id)
{
    pthread_mutex_lock(&g_mutex);
    g_read_count_mutex++;
    printf("  [读者 %d - Mutex] 读到: %s\n", id, g_cache[id % g_cache_size]);
    SLEEP_MS(50);  /* 模拟处理耗时 */
    pthread_mutex_unlock(&g_mutex);
}

/* 写操作 */
static void write_cache(int id)
{
    pthread_rwlock_wrlock(&g_rwlock);
    g_write_count++;
    g_cache[id % g_cache_size][0] = '\0';
    snprintf(g_cache[id % g_cache_size], CACHE_LINE_SIZE,
             "更新[%d]: 第 %d 次写入", id, g_write_count);
    printf("  [写者] 更新条目 %d: %s\n", id % g_cache_size,
           g_cache[id % g_cache_size]);
    SLEEP_MS(200);  /* 写操作更耗时 */
    pthread_rwlock_unlock(&g_rwlock);
}

/* 读者线程（用读写锁）*/
static void* reader_rw_thread(void *arg)
{
    int id = *(int *)arg;

    for (int i = 0; i < 5; i++) {
        read_with_rwlock(id);
        SLEEP_MS(30);  /* 读间隔 */
    }
    return NULL;
}

/* 读者线程（用互斥锁）*/
static void* reader_mutex_thread(void *arg)
{
    int id = *(int *)arg;

    for (int i = 0; i < 5; i++) {
        read_with_mutex(id);
        SLEEP_MS(30);
    }
    return NULL;
}

/* 写者线程 */
static void* writer_thread(void *arg)
{
    (void)arg;

    for (int i = 0; i < 3; i++) {
        SLEEP_MS(200);
        write_cache(i + 100);
    }
    return NULL;
}

void demo_readers_writers(void)
{
    printf("----- 读写锁 — 读者与写者 -----\n");
    printf("读多写少场景: 读写锁让读者并行，互斥锁让读者串行\n\n");

    pthread_rwlock_init(&g_rwlock, NULL);

    pthread_t readers[NUM_READERS];
    int ids[NUM_READERS];
    pthread_t writer;

    /* 先跑一轮读写锁版本 */
    printf("--- 读写锁版本 (读者并行) ---\n");
    for (int i = 0; i < NUM_READERS; i++) {
        ids[i] = i + 1;
        pthread_create(&readers[i], NULL, reader_rw_thread, &ids[i]);
    }
    pthread_create(&writer, NULL, writer_thread, NULL);

    for (int i = 0; i < NUM_READERS; i++) {
        pthread_join(readers[i], NULL);
    }
    pthread_join(writer, NULL);
    printf("  读写锁总读取次数: %d\n\n", g_read_count_rw);

    /* 再跑一轮普通互斥锁版本 */
    printf("--- 普通互斥锁版本 (读者串行) ---\n");
    for (int i = 0; i < NUM_READERS; i++) {
        ids[i] = i + 10;
        pthread_create(&readers[i], NULL, reader_mutex_thread, &ids[i]);
    }

    for (int i = 0; i < NUM_READERS; i++) {
        pthread_join(readers[i], NULL);
    }
    printf("  互斥锁总读取次数: %d\n\n", g_read_count_mutex);

    pthread_rwlock_destroy(&g_rwlock);
}

/* ============================================================================
 * 示例 2: 读写锁阻塞行为验证
 *
 * 多个读锁可共存，写锁与所有锁互斥
 * ============================================================================
 */

static pthread_rwlock_t g_demo_lock;  /* 在 main 中 init */

static void* hold_read_lock(void *arg)
{
    (void)arg;
    pthread_rwlock_rdlock(&g_demo_lock);
    printf("  [读持有者] 获得读锁，等待 2 秒...\n");
    SLEEP_MS(2000);
    pthread_rwlock_unlock(&g_demo_lock);
    printf("  [读持有者] 释放读锁\n");
    return NULL;
}

static void* try_write_lock(void *arg)
{
    (void)arg;
    SLEEP_MS(500);  /* 等读锁先获取 */
    printf("  [写尝试者] 尝试获取写锁 (此时有读锁)...\n");

    struct timespec start, end;
    clock_gettime(CLOCK_MONOTONIC, &start);

    pthread_rwlock_wrlock(&g_demo_lock);
    clock_gettime(CLOCK_MONOTONIC, &end);

    double elapsed = (end.tv_sec - start.tv_sec) +
                     (end.tv_nsec - start.tv_nsec) / 1e9;
    printf("  [写尝试者] 获得写锁 (等待了 %.1f 秒)\n", elapsed);
    pthread_rwlock_unlock(&g_demo_lock);
    return NULL;
}

void demo_blocking_behavior(void)
{
    printf("----- 读写锁阻塞行为 -----\n");
    printf("验证: 多个读锁共存，写锁等待所有读锁释放\n\n");

    pthread_rwlock_init(&g_demo_lock, NULL);
    pthread_t t1, t2, t3;

    /* 线程1: 持有读锁 2 秒 */
    pthread_create(&t1, NULL, hold_read_lock, NULL);
    /* 线程2: 尝试获取写锁（应被阻塞）*/
    SLEEP_MS(100);
    pthread_create(&t2, NULL, try_write_lock, NULL);
    /* 线程3: 尝试获取读锁（写锁优先？取决于实现，通常写锁优先）*/
    SLEEP_MS(100);
    pthread_create(&t3, NULL, hold_read_lock, NULL);

    pthread_join(t1, NULL);
    pthread_join(t2, NULL);
    pthread_join(t3, NULL);

    printf("\n");
    pthread_rwlock_destroy(&g_demo_lock);
}

/* ============================================================================
 * 示例 3: tryrdlock / trywrlock — 非阻塞尝试
 *
 * 不阻塞等待，立即返回 EBUSY 表示锁被占用。
 * ============================================================================
 */

void demo_try_lock(void)
{
    printf("----- 非阻塞 tryrdlock / trywrlock -----\n");

    pthread_rwlock_t lock;
    pthread_rwlock_init(&lock, NULL);
    int ret;

    /* 先加读锁 */
    pthread_rwlock_rdlock(&lock);
    printf("  已加读锁\n");

    /* 尝试加写锁（应失败）*/
    ret = pthread_rwlock_trywrlock(&lock);
    printf("  trywrlock (有读锁): %s\n",
           ret == 0 ? "成功" : (ret == EBUSY ? "EBUSY (被占用)" : strerror(ret)));

    /* 尝试加读锁（应成功——读锁可重入）*/
    ret = pthread_rwlock_tryrdlock(&lock);
    printf("  tryrdlock (已有读锁): %s\n",
           ret == 0 ? "成功 (可重入)" : strerror(ret));
    if (ret == 0) pthread_rwlock_unlock(&lock);  /* 释放重入的读锁 */

    pthread_rwlock_unlock(&lock);
    printf("  释放读锁\n");

    /* 现在加写锁 */
    pthread_rwlock_wrlock(&lock);
    printf("  已加写锁\n");

    /* 写锁下尝试加读锁（应失败）*/
    ret = pthread_rwlock_tryrdlock(&lock);
    printf("  tryrdlock (有写锁): %s\n",
           ret == 0 ? "成功" : (ret == EBUSY ? "EBUSY (被占用)" : strerror(ret)));

    pthread_rwlock_unlock(&lock);
    printf("  释放写锁\n");
    pthread_rwlock_destroy(&lock);
    printf("\n");
}

/* ============================================================================
 * 示例 4: 读锁升级/降级说明
 *
 * 注意：pthread_rwlock 不支持"从读锁升级为写锁"。
 * 如果持有读锁时尝试加写锁，会导致死锁！
 * 正确做法：先释放读锁，再加写锁。
 * ============================================================================
 */

void demo_upgrade_fail(void)
{
    printf("----- 读锁升级为写锁 (常见陷阱) -----\n");

    pthread_rwlock_t lock;
    pthread_rwlock_init(&lock, NULL);

    pthread_rwlock_rdlock(&lock);
    printf("  持有读锁\n");

    /* 尝试升级为写锁 — 会导致死锁！这里用 trywrlock 避免卡住 */
    int ret = pthread_rwlock_trywrlock(&lock);
    printf("  尝试升级读锁 -> 写锁: %s\n",
           ret == 0 ? "成功?! (可能平台相关)" :
           ret == EBUSY ? "EBUSY (不可升级)" :
           strerror(ret));

    pthread_rwlock_unlock(&lock);
    printf("  必须: 先释放读锁，再加写锁\n");
    pthread_rwlock_destroy(&lock);
    printf("\n");
}

/* ============================================================================
 * 主函数
 * ============================================================================
 */
int main(void)
{
    setbuf(stdout, NULL);  /* 禁用 stdout 缓冲 */
    printf("============================================\n");
    printf("  读写锁 (Read-Write Lock) 示例\n");
    printf("============================================\n\n");

    demo_readers_writers();
    demo_blocking_behavior();
    demo_try_lock();
    demo_upgrade_fail();

    /* ===== 使用注意事项 ===== */
    printf("============================================\n");
    printf("  使用注意事项\n");
    printf("============================================\n\n");

    printf("1. 读锁可共享: 多个读者可同时持有读锁\n");
    printf("2. 写锁独占: 写者与其他所有读者/写者互斥\n");
    printf("3. 适用场景: 读多写少，读者远多于写者\n");
    printf("4. 不可升级: 持有读锁时不能直接加写锁（会死锁）\n");
    printf("5. 写者优先: 大多数实现中，等待的写者比新读者优先\n");
    printf("6. 性能: 临界区很小时，普通互斥锁可能反而更快\n");
    printf("7. 伪共享: 读写锁内部状态缓存行对齐影响性能\n");

    printf("\n============================================\n");
    printf("  程序结束\n");
    printf("============================================\n");

    return 0;
}
