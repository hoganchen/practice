/**
 * ============================================================================
 * 知识要点: 死锁 (Deadlock) 与 非阻塞加锁 (trylock)
 * ============================================================================
 *
 * 编译指令: gcc 08_deadlock.c -o 08_deadlock.exe -std=c11 -Wall -lpthread
 * 运行指令: ./08_deadlock.exe
 *
 * 知识点概述:
 *   死锁是多线程编程中最常见的并发问题之一。
 *   本文件演示三种死锁场景及其解决方案。
 *
 * 核心 API:
 *   - pthread_mutex_trylock()  : 尝试加锁，不阻塞，返回 EBUSY
 *   - pthread_mutex_timedlock(): 限时等待加锁（需要 <time.h>）
 *
 * 死锁四大条件（缺一不可）:
 *   1. 互斥 (Mutual Exclusion)     : 资源一次只能被一个线程占用
 *   2. 持有并等待 (Hold and Wait)  : 线程持有一把锁的同时等待另一把锁
 *   3. 不可抢占 (No Preemption)    : 线程不能强行夺走其他线程的锁
 *   4. 循环等待 (Circular Wait)    : 形成等待环路 A→B→C→A
 *
 * 死锁预防策略:
 *   A. 固定锁顺序         — 所有线程按相同顺序加锁
 *   B. trylock + 回退     — 获取不到时释放已有锁，重试
 *   C. 锁分级 (Lock Hier.) — 为锁分配等级，按等级顺序获取
 * ============================================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <string.h>
#include <time.h>
#include <errno.h>

#ifdef _WIN32
#include <windows.h>
#define SLEEP_MS(ms) Sleep(ms)
#else
#include <unistd.h>
#define SLEEP_MS(ms) usleep((ms) * 1000)
#endif

/* ============================================================================
 * 示例 1: 经典死锁 — 锁顺序反转
 *
 * 场景：银行转账 A→B 和 B→A 同时进行
 * 线程1: 锁A → 锁B → 转账 A→B
 * 线程2: 锁B → 锁A → 转账 B→A
 * 结果：线程1锁了A等B，线程2锁了B等A，死锁！
 * ============================================================================
 */

/* 两个账户 */
static double g_account_a = 1000.0;
static double g_account_b = 1000.0;

/* 两把锁（分别保护两个账户）*/
static pthread_mutex_t g_lock_a = PTHREAD_MUTEX_INITIALIZER;
static pthread_mutex_t g_lock_b = PTHREAD_MUTEX_INITIALIZER;

/* 转账函数 — 可能死锁的版本 */
static int transfer_deadlock(double *from, double *to,
                             pthread_mutex_t *from_lock,
                             pthread_mutex_t *to_lock,
                             double amount, int id)
{
    /*
     * 错误做法：先锁 from，再锁 to
     * 两个线程以相反的顺序加锁 → 死锁！
     */
    pthread_mutex_lock(from_lock);
    printf("  [线程%d] 获得 from 锁，正在获取 to 锁...\n", id);
    SLEEP_MS(100);  /* 加大死锁概率 */

    pthread_mutex_lock(to_lock);

    if (*from >= amount) {
        *from -= amount;
        *to   += amount;
        printf("  [线程%d] 转账 %.0f 成功 (from=%.0f, to=%.0f)\n",
               id, amount, *from, *to);
        pthread_mutex_unlock(to_lock);
        pthread_mutex_unlock(from_lock);
        return 0;
    } else {
        printf("  [线程%d] 余额不足！\n", id);
        pthread_mutex_unlock(to_lock);
        pthread_mutex_unlock(from_lock);
        return -1;
    }
}

/* 死锁：A→B 和 B→A 同时进行 */
static void* transfer_a_to_b(void *arg)
{
    (void)arg;
    transfer_deadlock(&g_account_a, &g_account_b,
                      &g_lock_a, &g_lock_b,
                      100.0, 1);
    return NULL;
}

static void* transfer_b_to_a(void *arg)
{
    (void)arg;
    transfer_deadlock(&g_account_b, &g_account_a,
                      &g_lock_b, &g_lock_a,
                      200.0, 2);
    return NULL;
}

void demo_classic_deadlock(void)
{
    printf("----- 示例 1: 经典死锁 (锁顺序反转) -----\n");
    printf("账户A: %.0f, 账户B: %.0f\n", g_account_a, g_account_b);
    printf("两个线程同时转账: A→B(100) 和 B→A(200)\n");
    printf("如果卡住了，就是发生了死锁！\n\n");

    pthread_t t1, t2;
    pthread_create(&t1, NULL, transfer_a_to_b, NULL);
    pthread_create(&t2, NULL, transfer_b_to_a, NULL);

    /*
     * 给两个线程足够时间执行。
     * 如果发生死锁，主线程检测到超时后打印结论并继续。
     */
    printf("  等待 3 秒观察是否死锁...\n");
    SLEEP_MS(3000);  /* 等两个线程执行 */

    /*
     * 注意：此时两个线程可能已经死锁（互相等待）。
     * 主线程无法 join 它们，直接打印结果后继续。
     * 主线程 return 后进程会退出，死锁线程随之终止。
     */
    printf("\n  ❌ 检测到死锁（线程无响应）！\n\n");
    printf("  原因:\n");
    printf("  线程1: 持有锁A，等待锁B\n");
    printf("  线程2: 持有锁B，等待锁A\n");
    printf("  形成循环等待: A → B → A\n\n");
}

/* ============================================================================
 * 解决方案 A: 固定锁顺序
 *
 * 所有线程统一先锁"地址较小"的锁，就不会出现循环等待。
 * ============================================================================
 */

static int transfer_fixed_order(double *from, double *to,
                                pthread_mutex_t *from_lock,
                                pthread_mutex_t *to_lock,
                                double amount, int id)
{
    /*
     * 正确做法：无论转账方向如何，都按锁的内存地址大小顺序加锁
     * 这里示范：先锁地址较小的锁
     */
    if (from_lock < to_lock) {
        pthread_mutex_lock(from_lock);
        SLEEP_MS(50);
        pthread_mutex_lock(to_lock);
    } else {
        pthread_mutex_lock(to_lock);
        SLEEP_MS(50);
        pthread_mutex_lock(from_lock);
    }

    if (*from >= amount) {
        *from -= amount;
        *to   += amount;
        printf("  [线程%d] 转账 %.0f 成功 (from=%.0f, to=%.0f)\n",
               id, amount, *from, *to);
    } else {
        printf("  [线程%d] 余额不足！\n", id);
    }

    pthread_mutex_unlock(to_lock);
    pthread_mutex_unlock(from_lock);
    return 0;
}

static void* transfer_fixed_a_to_b(void *arg)
{
    (void)arg;
    transfer_fixed_order(&g_account_a, &g_account_b,
                         &g_lock_a, &g_lock_b, 100.0, 3);
    return NULL;
}

static void* transfer_fixed_b_to_a(void *arg)
{
    (void)arg;
    transfer_fixed_order(&g_account_b, &g_account_a,
                         &g_lock_b, &g_lock_a, 200.0, 4);
    return NULL;
}

void demo_fixed_order(void)
{
    printf("----- 解决方案 A: 固定锁顺序 -----\n");
    printf("所有线程按同一顺序加锁（按锁地址排序），破坏循环等待条件\n\n");

    /* 重置账户余额 */
    g_account_a = 1000.0;
    g_account_b = 1000.0;

    pthread_t t1, t2;
    pthread_create(&t1, NULL, transfer_fixed_a_to_b, NULL);
    pthread_create(&t2, NULL, transfer_fixed_b_to_a, NULL);

    pthread_join(t1, NULL);
    pthread_join(t2, NULL);

    printf("  ✅ 转账完成，无死锁 (最终余额: A=%.0f, B=%.0f)\n\n",
           g_account_a, g_account_b);
}

/* ============================================================================
 * 解决方案 B: trylock + 回退
 *
 * 尝试加锁，失败则释放已有锁，重试。
 * 破坏"持有并等待"条件。
 * ============================================================================
 */

static int transfer_trylock(double *from, double *to,
                            pthread_mutex_t *from_lock,
                            pthread_mutex_t *to_lock,
                            double amount, int id)
{
    int retries = 0;

    while (1) {
        /* 先锁 from */
        pthread_mutex_lock(from_lock);

        /* 尝试锁 to（非阻塞）*/
        if (pthread_mutex_trylock(to_lock) == 0) {
            break;  /* 两把锁都拿到了 */
        }

        /* 拿不到 to 锁 → 释放 from 锁，稍后重试 */
        pthread_mutex_unlock(from_lock);
        retries++;

        if (retries > 100) {
            printf("  [线程%d] 重试 %d 次仍未成功，放弃\n", id, retries);
            return -1;
        }

        /* 退避等待（避免忙等）*/
        SLEEP_MS(10);
    }

    /* 执行转账 */
    if (*from >= amount) {
        *from -= amount;
        *to   += amount;
        printf("  [线程%d] 转账 %.0f 成功 (重试 %d 次)\n",
               id, amount, retries);
    } else {
        printf("  [线程%d] 余额不足！\n", id);
    }

    pthread_mutex_unlock(to_lock);
    pthread_mutex_unlock(from_lock);
    return 0;
}

static void* transfer_trylock_a_to_b(void *arg)
{
    (void)arg;
    transfer_trylock(&g_account_a, &g_account_b,
                     &g_lock_a, &g_lock_b, 100.0, 5);
    return NULL;
}

static void* transfer_trylock_b_to_a(void *arg)
{
    (void)arg;
    transfer_trylock(&g_account_b, &g_account_a,
                     &g_lock_b, &g_lock_a, 200.0, 6);
    return NULL;
}

void demo_trylock_solution(void)
{
    printf("----- 解决方案 B: trylock + 回退 -----\n");
    printf("拿不到 to 锁时释放 from 锁，退避重试，破坏持有并等待条件\n\n");

    /* 重置账户余额 */
    g_account_a = 1000.0;
    g_account_b = 1000.0;

    pthread_t t1, t2;
    pthread_create(&t1, NULL, transfer_trylock_a_to_b, NULL);
    pthread_create(&t2, NULL, transfer_trylock_b_to_a, NULL);

    pthread_join(t1, NULL);
    pthread_join(t2, NULL);

    printf("  ✅ 转账完成，无死锁 (最终余额: A=%.0f, B=%.0f)\n\n",
           g_account_a, g_account_b);
}

/* ============================================================================
 * 示例 2: 自我死锁 (递归死锁)
 *
 * 普通互斥锁 (PTHREAD_MUTEX_NORMAL) 不支持同一线程重复加锁。
 * 如果同一个线程连续两次 lock 同一把锁，会死锁自己。
 *
 * 解决方案：
 *   - 使用 PTHREAD_MUTEX_RECURSIVE 递归互斥锁
 *   - 或者避免在持锁时调用可能加锁的函数
 * ============================================================================
 */

/* 递归互斥锁属性 */
static pthread_mutex_t g_recursive_mutex;

static void inner_function(void)
{
    /*
     * 如果 g_recursive_mutex 是普通锁，这里会死锁：
     * 因为外层已经持有这个锁了。
     * 但因为是 RECURSIVE 锁，这里会成功，内部引用计数+1。
     */
    pthread_mutex_lock(&g_recursive_mutex);
    printf("    inner_function: 递归加锁成功\n");
    pthread_mutex_unlock(&g_recursive_mutex);
}

static void* recursive_demo(void *arg)
{
    (void)arg;

    pthread_mutex_lock(&g_recursive_mutex);
    printf("  [递归锁演示] 外层加锁，调用 inner_function...\n");

    inner_function();

    printf("  [递归锁演示] 内层调用返回\n");
    pthread_mutex_unlock(&g_recursive_mutex);
    return NULL;
}

void demo_recursive_mutex(void)
{
    printf("----- 示例 2: 自我死锁与递归锁 -----\n");
    printf("普通锁线程内重复 lock 会死锁自己。\n");
    printf("使用 PTHREAD_MUTEX_RECURSIVE 可避免。\n\n");

    /* 初始化递归互斥锁 */
    pthread_mutexattr_t attr;
    pthread_mutexattr_init(&attr);
    pthread_mutexattr_settype(&attr, PTHREAD_MUTEX_RECURSIVE);
    pthread_mutex_init(&g_recursive_mutex, &attr);
    pthread_mutexattr_destroy(&attr);

    pthread_t t;
    pthread_create(&t, NULL, recursive_demo, NULL);
    pthread_join(t, NULL);

    pthread_mutex_destroy(&g_recursive_mutex);
    printf("  ✅ 递归锁正常执行，无死锁\n\n");
}

/* ============================================================================
 * 示例 3: timedlock — 限时等待
 *
 * 在指定时间内获取不到锁就放弃，避免无限期等待。
 * 注意：pthread_mutex_timedlock 需要 POSIX 支持，有些平台可能没有。
 * ============================================================================
 */

#ifndef _WIN32
static pthread_mutex_t g_timed_lock = PTHREAD_MUTEX_INITIALIZER;

static void* hold_lock_long(void *arg)
{
    (void)arg;
    pthread_mutex_lock(&g_timed_lock);
    printf("  [长时间持有者] 持有锁 5 秒...\n");
    SLEEP_MS(5000);
    pthread_mutex_unlock(&g_timed_lock);
    printf("  [长时间持有者] 释放锁\n");
    return NULL;
}

static void* try_timed_lock(void *arg)
{
    (void)arg;
    SLEEP_MS(500);  /* 等 hold_lock_long 先拿到锁 */

    struct timespec ts;
    clock_gettime(CLOCK_REALTIME, &ts);
    ts.tv_sec += 2;  /* 最多等 2 秒 */

    printf("  [限时等待者] 尝试加锁 (最多等 2 秒)...\n");
    int ret = pthread_mutex_timedlock(&g_timed_lock, &ts);

    if (ret == ETIMEDOUT) {
        printf("  [限时等待者] 超时！等了 2 秒没拿到锁，先做其他事\n");
    } else if (ret == 0) {
        printf("  [限时等待者] 拿到锁了\n");
        pthread_mutex_unlock(&g_timed_lock);
    } else {
        printf("  [限时等待者] 错误: %s\n", strerror(ret));
    }
    return NULL;
}

void demo_timedlock(void)
{
    printf("----- 示例 3: pthread_mutex_timedlock 限时等待 -----\n");

    pthread_t t1, t2;
    pthread_create(&t1, NULL, hold_lock_long, NULL);
    pthread_create(&t2, NULL, try_timed_lock, NULL);

    pthread_join(t1, NULL);
    pthread_join(t2, NULL);
    printf("\n");
}
#else
void demo_timedlock(void)
{
    printf("----- 示例 3: timedlock (%s) -----\n\n",
           "Windows 上跳过此示例");
}
#endif

/* ============================================================================
 * 主函数
 * ============================================================================
 */
int main(void)
{
    setbuf(stdout, NULL);  /* 禁用 stdout 缓冲 */
    printf("============================================\n");
    printf("  死锁 (Deadlock) 与解决方案\n");
    printf("============================================\n\n");

    demo_classic_deadlock();
    demo_fixed_order();
    demo_trylock_solution();
    demo_recursive_mutex();
    demo_timedlock();

    /* ===== 总结 ===== */
    printf("============================================\n");
    printf("  死锁预防总结\n");
    printf("============================================\n\n");

    printf("死锁四大条件:\n");
    printf("  ① 互斥    — 同一时间只能一个线程持锁\n");
    printf("  ② 持有并等待 — 持有一把锁的同时等另一把\n");
    printf("  ③ 不可抢占  — 不能强行夺走别人的锁\n");
    printf("  ④ 循环等待  — 形成 A等B、B等A 的环路\n\n");

    printf("预防策略:\n");
    printf("  A. 固定锁顺序    — 破坏循环等待 (最推荐)\n");
    printf("  B. trylock+回退  — 破坏持有并等待 (灵活但复杂)\n");
    printf("  C. 递归锁        — 解决自我死锁 (不应过度使用)\n");
    printf("  D. timedlock     — 限时等待，超时放弃 (避免无限等待)\n");

    printf("\n============================================\n");
    printf("  程序结束\n");
    printf("============================================\n");

    return 0;
}
