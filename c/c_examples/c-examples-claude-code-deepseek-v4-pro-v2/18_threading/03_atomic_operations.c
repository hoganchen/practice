/**
 * ============================================================================
 * 知识要点: 原子操作 (<stdatomic.h>) — C11 引入
 * ============================================================================
 *
 * 编译指令: gcc 03_atomic_operations.c -o 03_atomic_operations.exe -std=c11 -Wall -lpthread
 * 运行指令: ./03_atomic_operations.exe
 * 注意: 某些平台可能需要额外链接 -latomic，如: gcc ... -lpthread -latomic
 *
 * 知识点概述:
 *   原子操作是在多线程环境下不需要互斥锁就能安全执行的不可分割操作。
 *   C11 在 <stdatomic.h> 中提供了标准原子类型和操作。
 *
 * 核心类型:
 *   - atomic_int         : 原子整型
 *   - atomic_uint        : 原子无符号整型
 *   - atomic_long        : 原子长整型
 *   - atomic_llong       : 原子长长整型
 *   - atomic_bool        : 原子布尔型
 *   - atomic_flag        : 原子标志（保证是无锁的）
 *   - atomic_char, atomic_short 等
 *   - _Atomic(int)       : 通用原子类型限定符
 *
 * 核心操作:
 *   - atomic_store(p, val)     : 原子写入
 *   - atomic_load(p)           : 原子读取
 *   - atomic_fetch_add(p, n)   : 原子加，返回旧值
 *   - atomic_fetch_sub(p, n)   : 原子减，返回旧值
 *   - atomic_fetch_or/and/xor  : 原子位运算
 *   - atomic_exchange(p, val)  : 原子交换，返回旧值
 *   - atomic_compare_exchange_strong/weak : CAS（比较并交换）
 *
 * 内存序 (memory_order):
 *   - memory_order_relaxed — 最弱，仅保证原子性，不保证顺序
 *   - memory_order_consume — 数据依赖顺序（较少使用）
 *   - memory_order_acquire — 防止后面的读写重排到前面
 *   - memory_order_release — 防止前面的读写重排到后面
 *   - memory_order_acq_rel — acquire + release
 *   - memory_order_seq_cst — 最强，全局顺序一致（默认）
 * ============================================================================
 */

#include "../common/charset.h"
#include <stdio.h>      /* printf */
#include <stdatomic.h>   /* 原子类型和操作 */
#include <stdbool.h>     /* bool, true, false */
#include <pthread.h>     /* pthread_create, pthread_join */
#include <stdlib.h>      /* malloc, free, exit */
#include <string.h>      /* memset */
#include <time.h>        /* timespec 用于 nanosleep */

/* ============================================================================
 * 示例 1: 基础原子计数器（无锁）
 *
 * 多个线程同时增加计数器，无需互斥锁
 * ============================================================================
 */

/* 共享的原子计数器 */
static atomic_int g_counter = ATOMIC_VAR_INIT(0);
/* 注意: ATOMIC_VAR_INIT 在 C11 中用于初始化，C17 起已弃用，
 * 通常可以直接赋值: static atomic_int g_counter = 0; */

/* 非原子的整型（用于对比）*/
static int g_normal_counter = 0;

/* 每个线程增加计数器的次数 */
#define INCREMENT_PER_THREAD 100000

/* 线程函数: 增加原子计数器 */
static void* thread_atomic_add(void *arg)
{
    (void)arg;  /* 忽略参数 */

    for (int i = 0; i < INCREMENT_PER_THREAD; i++) {
        atomic_fetch_add(&g_counter, 1);  /* 原子加 1 */
    }

    return NULL;
}

/* 线程函数: 增加普通计数器（非原子，用于对比）*/
static void* thread_normal_add(void *arg)
{
    (void)arg;

    for (int i = 0; i < INCREMENT_PER_THREAD; i++) {
        g_normal_counter++;  /* 非原子操作 — 线程不安全 */
    }

    return NULL;
}

/* ============================================================================
 * 示例 2: 原子获取-修改-返回旧值
 *
 * 使用 atomic_fetch_add 和 atomic_fetch_sub
 * 可以用来实现无锁的 ID 分配器
 * ============================================================================
 */

/* 全局 ID 分配器 */
static atomic_int g_next_id = ATOMIC_VAR_INIT(1000);

/* 使用原子操作获取一个唯一的 ID */
int allocate_id(void)
{
    /* atomic_fetch_add 返回旧值（即分配出去的 ID）*/
    return atomic_fetch_add(&g_next_id, 1);
}

/* ============================================================================
 * 示例 3: 原子标志 — 实现简单的自旋锁
 *
 * atomic_flag 是唯一保证无锁的原子类型
 * 适用于实现简单的自旋锁（但注意忙等待消耗 CPU）
 * ============================================================================
 */

/* 原子标志 — 初始为 false (clear) */
static atomic_flag g_spinlock = ATOMIC_FLAG_INIT;

/* 获取自旋锁 (test-and-set)
 * 原子地将标志设置为 true，并返回之前的旧值
 * 如果旧值为 false (未锁定)，则当前线程获得锁
 * 如果旧值为 true (已锁定)，则循环等待
 */
void spinlock_lock(void)
{
    /* atomic_flag_test_and_set 返回旧值
     * 旧值为 false → 锁之前是空闲的，我们获得了锁
     * 旧值为 true  → 锁被他人持有，继续等待
     */
    while (atomic_flag_test_and_set(&g_spinlock)) {
        /* 忙等待 — 实际应用中应使用更友好的锁 */
        /* 这里可以加一个 CPU 暂停指令减少功耗 */
        /* 如 __asm__ volatile ("pause" ::: "memory"); */
    }
}

/* 释放自旋锁 */
void spinlock_unlock(void)
{
    atomic_flag_clear(&g_spinlock);
}

/* 受自旋锁保护的共享数据 */
static int g_spin_protected_data = 0;

static void* thread_spinlock_worker(void *arg)
{
    (void)arg;

    for (int i = 0; i < 10000; i++) {
        spinlock_lock();
        g_spin_protected_data++;  /* 临界区 */
        spinlock_unlock();
    }

    return NULL;
}

/* ============================================================================
 * 示例 4: 比较并交换 (CAS) — Compare And Swap
 *
 * atomic_compare_exchange_strong:
 *   如果 *ptr == expected，则将 *ptr 设为 desired，返回 true
 *   否则将 expected 更新为 *ptr 的当前值，返回 false
 *
 * atomic_compare_exchange_weak:
 *   与 strong 类似，但可能发生虚假失败（spurious failure）
 *   在循环中使用 weak 通常更高效
 * ============================================================================
 */

/* 使用 CAS 实现的无锁栈（单链表节点）*/
typedef struct Node {
    int value;
    struct Node *next;
} Node;

/* 原子栈顶指针 */
static atomic_intptr_t g_stack_top;  /* 用 intptr_t 存储指针 */

/* 无锁栈的 push 操作 */
void lockfree_push(Node *new_node)
{
    if (new_node == NULL) return;

    /* 将新的节点的 next 指向当前栈顶 */
    Node *old_top = (Node*)atomic_load(&g_stack_top);

    do {
        new_node->next = old_top;                          /* 设置新节点的 next */
    } while (!atomic_compare_exchange_weak(
                 &g_stack_top,                             /* 目标原子变量 */
                 (intptr_t*)&old_top,                      /* expected: 旧栈顶 */
                 (intptr_t)new_node                        /* desired: 新节点地址 */
             ));
    /* 如果 CAS 成功，栈顶被更新为新节点
     * 如果 CAS 失败（有其他线程先修改了栈顶），
     * old_top 会被更新为当前栈顶，然后重试 */
}

/* 无锁栈的 pop 操作 */
Node* lockfree_pop(void)
{
    Node *old_top = (Node*)atomic_load(&g_stack_top);

    while (old_top != NULL) {
        Node *next = old_top->next;
        if (atomic_compare_exchange_weak(
                &g_stack_top,
                (intptr_t*)&old_top,
                (intptr_t)next
            )) {
            return old_top;  /* 成功弹出节点 */
        }
        /* CAS 失败，old_top 已被更新，继续循环 */
    }

    return NULL;  /* 栈为空 */
}

/* ============================================================================
 * 示例 5: 内存序 (memory_order) 演示
 *
 * 不同内存序对性能和行为的影响
 * ============================================================================
 */

/* 带 release 语义的生产者和带 acquire 语义的消费者 */
static atomic_int g_data_ready = ATOMIC_VAR_INIT(0);
static int g_shared_data = 0;

/* 生产者线程: 先写数据，再设置标志（release 语义）*/
void* producer(void *arg)
{
    (void)arg;

    g_shared_data = 42;                    /* 写数据 */

    /* release 语义: 本行之前的所有写操作（g_shared_data=42）
     * 对其他线程的 acquire 操作可见 */
    atomic_store_explicit(&g_data_ready, 1, memory_order_release);

    printf("生产者: g_shared_data = 42, 标志已设置\n");
    return NULL;
}

/* 消费者线程: 等待标志，再读取数据（acquire 语义）*/
void* consumer(void *arg)
{
    (void)arg;

    /* acquire 语义: 本行之后的所有读操作能看到
     * release 线程在 store 之前的所有写操作 */
    while (atomic_load_explicit(&g_data_ready, memory_order_acquire) == 0) {
        /* 等待生产者设置标志 */
    }

    /* 由于 acquire-release 语义保证，此处一定能读到 42 */
    printf("消费者: g_shared_data = %d (应该为 42)\n", g_shared_data);

    return NULL;
}

/* ============================================================================
 * 示例 6: atomic_bool 做退出标志
 *
 * 使用 atomic_bool 作为线程的退出信号
 * ============================================================================
 */

static atomic_bool g_running = ATOMIC_VAR_INIT(true);

void* worker_thread(void *arg)
{
    (void)arg;
    long iterations = 0;

    while (atomic_load(&g_running)) {
        iterations++;
        /* 模拟工作 */
        if (iterations % 5000000 == 0) {
            printf("工作线程: 已执行 %ld 次迭代...\n", iterations);
        }
    }

    printf("工作线程: 退出信号收到，共执行 %ld 次迭代\n", iterations);
    return NULL;
}

/* ============================================================================
 * 主函数
 * ============================================================================
 */
int main(void)
{
    pthread_t threads[4];
    int ret;

    printf("============================================\n");
    printf("  原子操作 (Atomic Operations) 示例\n");
    printf("============================================\n");

    /* ----------------------------------------------------------------
     * 示例 1: 原子计数器 vs 普通计数器
     * ---------------------------------------------------------------- */
    printf("\n====== 示例 1: 原子计数器 vs 普通计数器 ======\n");

    /* 启动 4 个线程同时增加原子计数器 */
    for (int i = 0; i < 4; i++) {
        ret = pthread_create(&threads[i], NULL, thread_atomic_add, NULL);
        if (ret != 0) {
            fprintf(stderr, "创建线程失败\n");
            exit(1);
        }
    }
    for (int i = 0; i < 4; i++) {
        pthread_join(threads[i], NULL);
    }

    /* 启动 4 个线程同时增加普通计数器 */
    for (int i = 0; i < 4; i++) {
        ret = pthread_create(&threads[i], NULL, thread_normal_add, NULL);
        if (ret != 0) {
            fprintf(stderr, "创建线程失败\n");
            exit(1);
        }
    }
    for (int i = 0; i < 4; i++) {
        pthread_join(threads[i], NULL);
    }

    int expected = 4 * INCREMENT_PER_THREAD;
    printf("原子计数器值:     %d (期望: %d) %s\n",
           atomic_load(&g_counter), expected,
           atomic_load(&g_counter) == expected ? "✓ 正确" : "✗ 错误");
    printf("普通计数器值:     %d (期望: %d) %s\n",
           g_normal_counter, expected,
           g_normal_counter == expected ? "✓ 正确" : "✗ 错误(数据竞争导致)");

    /* ----------------------------------------------------------------
     * 示例 2: 原子 ID 分配器
     * ---------------------------------------------------------------- */
    printf("\n====== 示例 2: 原子 ID 分配器 ======\n");

    printf("分配的 ID: ");
    for (int i = 0; i < 10; i++) {
        printf("%d ", allocate_id());
    }
    printf("\n");

    /* ----------------------------------------------------------------
     * 示例 3: atomic_flag 自旋锁
     * ---------------------------------------------------------------- */
    printf("\n====== 示例 3: atomic_flag 自旋锁 ======\n");

    for (int i = 0; i < 4; i++) {
        ret = pthread_create(&threads[i], NULL, thread_spinlock_worker, NULL);
        if (ret != 0) {
            fprintf(stderr, "创建线程失败\n");
            exit(1);
        }
    }
    for (int i = 0; i < 4; i++) {
        pthread_join(threads[i], NULL);
    }

    printf("自旋锁保护的数据: %d (期望: %d) %s\n",
           g_spin_protected_data, 4 * 10000,
           g_spin_protected_data == 4 * 10000 ? "✓ 正确" : "✗ 错误");

    /* ----------------------------------------------------------------
     * 示例 4: CAS 无锁栈
     * ---------------------------------------------------------------- */
    printf("\n====== 示例 4: CAS 无锁栈 ======\n");

    Node nodes[5];
    for (int i = 0; i < 5; i++) {
        nodes[i].value = (i + 1) * 10;
        nodes[i].next = NULL;
    }

    lockfree_push(&nodes[0]);
    lockfree_push(&nodes[1]);
    lockfree_push(&nodes[2]);

    printf("无锁栈内容: ");
    Node *n = lockfree_pop();
    while (n != NULL) {
        printf("%d ", n->value);
        n = lockfree_pop();
    }
    printf("\n");

    /* ----------------------------------------------------------------
     * 示例 5: 内存序 (acquire-release)
     * ---------------------------------------------------------------- */
    printf("\n====== 示例 5: 内存序 acquire-release ======\n");

    pthread_t prod_tid, cons_tid;
    pthread_create(&prod_tid, NULL, producer, NULL);
    pthread_create(&cons_tid, NULL, consumer, NULL);
    pthread_join(prod_tid, NULL);
    pthread_join(cons_tid, NULL);

    /* ----------------------------------------------------------------
     * 示例 6: atomic_bool 退出标志
     * ---------------------------------------------------------------- */
    printf("\n====== 示例 6: atomic_bool 退出标志 ======\n");

    pthread_t worker;
    pthread_create(&worker, NULL, worker_thread, NULL);

    /* 让工作线程运行一小段时间 */
    struct timespec ts = {0, 10000000};  /* 10ms */
    nanosleep(&ts, NULL);

    /* 设置退出标志 */
    atomic_store(&g_running, false);
    printf("主线程: 已设置退出标志\n");

    pthread_join(worker, NULL);

    printf("\n============================================\n");
    printf("  程序运行完毕\n");
    printf("============================================\n");

    return 0;
}

/* ============================================================================
 * 最佳实践总结:
 *
 * 1. 什么时候用原子操作?
 *    - 简单的计数器、标志位（atomic_int, atomic_bool）
 *    - 无锁数据结构（需要 CAS 等高级操作）
 *    - 性能敏感且竞争不激烈的场景
 *    - 需要避免死锁的场景（如信号处理函数中）
 *
 * 2. 什么时候应该用互斥锁?
 *    - 保护较大的临界区
 *    - 保护复杂数据结构的多个字段
 *    - 需要条件变量的同步场景（pthread_cond_wait）
 *    - 竞争激烈的共享资源
 *
 * 3. 内存序选择指南:
 *    - memory_order_relaxed: 无顺序保证，仅保证原子性（计数器等）
 *    - memory_order_acquire/release: 用于数据传递（生产者-消费者）
 *    - memory_order_seq_cst: 默认，最安全但最慢
 *    - 如果不确定，使用默认的 memory_order_seq_cst
 *
 * 4. 注意事项:
 *    - atomic_flag 是唯一保证无锁的类型，适合自旋锁
 *    - 原子操作比非原子操作慢，但比锁快
 *    - CAS 的 weak 版本可能虚假失败，需在循环中使用
 *    - 某些平台需要 -latomic 链接库
 *    - 原子操作不能替代锁的所有用途
 * ============================================================================
 */
