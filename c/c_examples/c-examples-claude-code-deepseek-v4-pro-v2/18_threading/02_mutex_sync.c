/*
 * 知识点：互斥锁用于线程同步 (Mutex Synchronization)
 *
 * 编译指令：gcc 02_mutex_sync.c -o 02_mutex_sync.exe -std=c11 -Wall -lpthread
 * 运行指令：./02_mutex_sync.exe
 *
 * 本文件演示：
 *   - 竞争条件 (Race Condition)：多个线程同时访问共享数据导致的问题
 *   - pthread_mutex_t 互斥锁的基本使用
 *   - pthread_mutex_init / pthread_mutex_destroy 初始化/销毁
 *   - pthread_mutex_lock / pthread_mutex_unlock 锁定/解锁
 *
 * 核心概念：
 *   互斥锁确保同一时间只有一个线程可以访问共享资源
 *   使用锁的步骤：初始化 -> 加锁 -> 访问共享资源 -> 解锁 -> 销毁
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <string.h>

#ifdef _WIN32
#include <windows.h>
#define SLEEP_MS(ms) Sleep(ms)
#else
#include <unistd.h>
#define SLEEP_MS(ms) usleep((ms) * 1000)
#endif

/* ===== 共享数据 ===== */

/* 共享计数器（不使用互斥锁保护） */
static volatile int counter_no_mutex = 0;

/* 共享计数器（使用互斥锁保护） */
static volatile int counter_with_mutex = 0;

/* 互斥锁对象 */
static pthread_mutex_t mutex;

/* 每个线程的递增次数 */
#define INCREMENTS_PER_THREAD 100000

/* ===== 不加锁的线程函数 ===== */

/**
 * 线程函数：不安全地递增计数器
 * 没有互斥锁保护，多个线程同时读写导致竞争条件
 * 最终结果很可能不等于 线程数 * INCREMENTS_PER_THREAD
 */
void *unsafe_increment(void *arg) {
    int thread_id = *(int *)arg;

    for (int i = 0; i < INCREMENTS_PER_THREAD; i++) {
        /*
         * 危险！counter_no_mutex++ 不是原子操作！
         * 实际上分为三步：
         *   1. 从内存读取 counter_no_mutex 到寄存器
         *   2. 在寄存器中加 1
         *   3. 将结果写回内存
         *
         * 如果两个线程同时执行到第 1 步，读取到相同值，
         * 各自加 1 后写回，实际只增加了 1 而不是 2！
         * 这就是竞争条件 (Race Condition)。
         */
        counter_no_mutex++;
    }

    printf("  [线程 %d] 不安全递增完成\n", thread_id);
    return NULL;
}

/* ===== 加锁的线程函数 ===== */

/**
 * 线程函数：安全地递增计数器
 * 使用互斥锁保护共享数据，确保每次只有一个线程访问
 */
void *safe_increment(void *arg) {
    int thread_id = *(int *)arg;

    for (int i = 0; i < INCREMENTS_PER_THREAD; i++) {

        /* 加锁：如果锁已被其他线程持有，这里会阻塞等待 */
        pthread_mutex_lock(&mutex);

        /*
         * 临界区 (Critical Section)：
         * 只有一个线程能执行到这里
         * 其他尝试加锁的线程会阻塞等待
         */
        counter_with_mutex++;

        /* 解锁：允许其他线程获取锁 */
        pthread_mutex_unlock(&mutex);

        /*
         * 注意：锁的粒度 (Granularity) 很重要
         * 如果锁的粒度过粗，会降低并发性能
         * 如果锁的粒度过细，可能无法有效防止竞争
         * 通常原则：临界区尽可能小，但必须完整保护共享数据
         */
    }

    printf("  [线程 %d] 安全递增完成\n", thread_id);
    return NULL;
}

/* ===== 演示银行账户操作 ===== */

/* 银行账户余额 */
static double bank_balance = 1000.0;

/* 银行账户锁 */
static pthread_mutex_t bank_mutex;

/**
 * 线程函数：模拟取款操作
 * 带互斥锁保护，防止余额不一致
 */
void *withdraw(void *arg) {
    double amount = *(double *)arg;

    printf("  [取款] 尝试取款 %.2f 元...\n", amount);

    /* 加锁保护余额操作 */
    pthread_mutex_lock(&bank_mutex);

    /* 检查余额是否足够 */
    if (bank_balance >= amount) {
        printf("  [取款] 余额 %.2f 足够，正在取款...\n", bank_balance);

        /* 模拟取款操作的处理时间 */
        SLEEP_MS(100);

        bank_balance -= amount;
        printf("  [取款] 取款成功！剩余余额: %.2f\n", bank_balance);
    } else {
        printf("  [取款] 余额不足！当前余额: %.2f，需要: %.2f\n",
               bank_balance, amount);
    }

    pthread_mutex_unlock(&bank_mutex);

    return NULL;
}

/* ===== 主函数 ===== */

int main() {
    printf("============================================\n");
    printf("  互斥锁在线程同步中的应用\n");
    printf("============================================\n\n");

    /* ===== 1. 演示竞争条件 ===== */
    printf("----- 1. 竞争条件演示 (无锁) -----\n");

    pthread_t t1, t2, t3;
    int id1 = 1, id2 = 2, id3 = 3;
    int expected = 3 * INCREMENTS_PER_THREAD;

    /* 创建 3 个线程，不加锁地递增计数器 */
    pthread_create(&t1, NULL, unsafe_increment, &id1);
    pthread_create(&t2, NULL, unsafe_increment, &id2);
    pthread_create(&t3, NULL, unsafe_increment, &id3);

    pthread_join(t1, NULL);
    pthread_join(t2, NULL);
    pthread_join(t3, NULL);

    printf("\n期望值: %d (3 * %d)\n", expected, INCREMENTS_PER_THREAD);
    printf("实际值: %d\n", counter_no_mutex);
    printf("差异:   %d\n", expected - counter_no_mutex);
    printf("结论:   由于竞争条件，结果 != 期望值！\n\n");

    /* ===== 2. 使用互斥锁解决竞争 ===== */
    printf("----- 2. 使用互斥锁 (有锁) -----\n");

    /* 初始化互斥锁
     * 参数1: 指向 mutex 的指针
     * 参数2: 属性（NULL 表示默认属性）*/
    pthread_mutex_init(&mutex, NULL);

    /* 创建 3 个线程，使用互斥锁保护计数器 */
    pthread_create(&t1, NULL, safe_increment, &id1);
    pthread_create(&t2, NULL, safe_increment, &id2);
    pthread_create(&t3, NULL, safe_increment, &id3);

    pthread_join(t1, NULL);
    pthread_join(t2, NULL);
    pthread_join(t3, NULL);

    printf("\n期望值: %d (3 * %d)\n", expected, INCREMENTS_PER_THREAD);
    printf("实际值: %d\n", counter_with_mutex);
    printf("结论:   使用互斥锁后，结果正确！\n\n");

    /* 销毁互斥锁 */
    pthread_mutex_destroy(&mutex);

    /* ===== 3. 实际场景：银行取款 ===== */
    printf("----- 3. 实际应用场景：银行取款 -----\n");

    /* 初始化银行账户锁 */
    pthread_mutex_init(&bank_mutex, NULL);

    double withdraw1 = 600.0;
    double withdraw2 = 600.0;

    printf("初始余额: %.2f 元\n", bank_balance);
    printf("两个客户同时取款 %.2f 元和 %.2f 元\n\n",
           withdraw1, withdraw2);

    /* 模拟两个同时取款的操作 */
    pthread_create(&t1, NULL, withdraw, &withdraw1);
    pthread_create(&t2, NULL, withdraw, &withdraw2);

    pthread_join(t1, NULL);
    pthread_join(t2, NULL);

    printf("\n最终余额: %.2f 元 (不应为负数！)\n", bank_balance);
    printf("如果没有锁保护，两个取款操作可能导致余额为负\n");

    pthread_mutex_destroy(&bank_mutex);

    /* ===== 4. 互斥锁使用注意事项 ===== */
    printf("\n----- 4. 互斥锁使用注意事项 -----\n");

    printf("1) 忘记解锁 (deadlock)：锁定后必须确保解锁\n");
    printf("2) 不要重复加锁同一把锁（普通锁会导致死锁）\n");
    printf("3) 临界区尽量小，提高并发性能\n");
    printf("4) 始终配对使用 lock/unlock\n");
    printf("5) 使用前务必初始化，使用后务必销毁\n");
    printf("6) 避免持锁时调用可能阻塞的函数\n");
    printf("7) pthread_mutex_t 是结构体，不要直接拷贝\n");

    printf("\n============================================\n");
    printf("  程序结束\n");
    printf("============================================\n");

    return 0;
}
