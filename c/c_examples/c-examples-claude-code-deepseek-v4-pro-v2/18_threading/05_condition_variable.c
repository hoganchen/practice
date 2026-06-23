/**
 * ============================================================================
 * 知识要点: 条件变量 (Condition Variable)
 * ============================================================================
 *
 * 编译指令: gcc 05_condition_variable.c -o 05_condition_variable.exe -std=c11 -Wall -lpthread
 * 运行指令: ./05_condition_variable.exe
 *
 * 知识点概述:
 *   条件变量是一种线程同步机制，用于阻塞等待某个条件成立。
 *   与互斥锁配合使用，避免忙等待（busy-wait）浪费 CPU。
 *
 * 核心 API:
 *   - pthread_cond_t           : 条件变量类型
 *   - pthread_cond_init()      : 初始化条件变量
 *   - pthread_cond_destroy()   : 销毁条件变量
 *   - pthread_cond_wait()      : 等待条件（原子性地解锁 + 阻塞等待）
 *   - pthread_cond_signal()    : 唤醒一个等待线程
 *   - pthread_cond_broadcast() : 唤醒所有等待线程
 *
 * 核心概念:
 *   1. 条件变量必须与互斥锁配合使用
 *   2. pthread_cond_wait 自动释放锁并阻塞，被唤醒后自动重新加锁
 *   3. 必须在 while 循环中检查条件（防止虚假唤醒 spurious wakeup）
 *   4. signal 唤醒一个等待线程，broadcast 唤醒所有
 * ============================================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <string.h>
#include <stdbool.h>
#include <stdatomic.h>
#include <stdarg.h>

#ifdef _WIN32
#include <windows.h>
#define SLEEP_MS(ms) Sleep(ms)
#else
#include <unistd.h>
#define SLEEP_MS(ms) usleep((ms) * 1000)
#endif

/* ============================================================================
 * 示例 1: 生产者-消费者（一对一）
 *
 * 一个生产者生产数据，一个消费者消费数据。
 * 消费者在队列为空时通过条件变量休眠等待。
 * ============================================================================
 */

#define BUFFER_SIZE 5

/* 环形队列缓冲区 */
typedef struct {
    int buffer[BUFFER_SIZE];    /* 数据缓冲区 */
    int head;                   /* 读位置 */
    int tail;                   /* 写位置 */
    int count;                  /* 当前元素个数 */
    pthread_mutex_t mutex;      /* 互斥锁 */
    pthread_cond_t cond_not_empty;  /* 条件：队列非空（消费者等待） */
    pthread_cond_t cond_not_full;   /* 条件：队列未满（生产者等待） */
} BoundedBuffer;

/* 初始化有界缓冲区 */
void buffer_init(BoundedBuffer *bb) {
    memset(bb->buffer, 0, sizeof(bb->buffer));
    bb->head = 0;
    bb->tail = 0;
    bb->count = 0;
    pthread_mutex_init(&bb->mutex, NULL);
    pthread_cond_init(&bb->cond_not_empty, NULL);
    pthread_cond_init(&bb->cond_not_full, NULL);
}

/* 销毁有界缓冲区 */
void buffer_destroy(BoundedBuffer *bb) {
    pthread_mutex_destroy(&bb->mutex);
    pthread_cond_destroy(&bb->cond_not_empty);
    pthread_cond_destroy(&bb->cond_not_full);
}

/* 生产者：往缓冲区放数据 */
void buffer_put(BoundedBuffer *bb, int data) {
    pthread_mutex_lock(&bb->mutex);

    /* while 循环检查条件（防止虚假唤醒）*/
    while (bb->count >= BUFFER_SIZE) {
        /*
         * 缓冲区满了，等待"非满"条件
         * pthread_cond_wait 会原子性地：
         *   1. 释放 mutex
         *   2. 阻塞等待条件变量
         * 被唤醒后会自动重新获取 mutex
         */
        printf("  [生产者] 缓冲区已满，等待消费...\n");
        pthread_cond_wait(&bb->cond_not_full, &bb->mutex);
        printf("  [生产者] 被唤醒，继续生产\n");
    }

    /* 放入数据 */
    bb->buffer[bb->tail] = data;
    bb->tail = (bb->tail + 1) % BUFFER_SIZE;
    bb->count++;
    printf("  [生产者] 放入: %d (当前 %d 个元素)\n", data, bb->count);

    /* 通知消费者：队列不为空了 */
    pthread_cond_signal(&bb->cond_not_empty);

    pthread_mutex_unlock(&bb->mutex);
}

/* 消费者：从缓冲区取数据 */
int buffer_get(BoundedBuffer *bb) {
    pthread_mutex_lock(&bb->mutex);

    /* while 循环检查条件（防止虚假唤醒）*/
    while (bb->count <= 0) {
        /*
         * 缓冲区空了，等待"非空"条件
         * 注意：pthread_cond_wait 可能被虚假唤醒（没有 signal 却返回）
         * 所以必须在循环中重新检查条件
         */
        printf("  [消费者] 缓冲区为空，等待生产...\n");
        pthread_cond_wait(&bb->cond_not_empty, &bb->mutex);
        printf("  [消费者] 被唤醒，继续消费\n");
    }

    /* 取出数据 */
    int data = bb->buffer[bb->head];
    bb->head = (bb->head + 1) % BUFFER_SIZE;
    bb->count--;
    printf("  [消费者] 取出: %d (剩余 %d 个元素)\n", data, bb->count);

    /* 通知生产者：队列不满 */
    pthread_cond_signal(&bb->cond_not_full);

    pthread_mutex_unlock(&bb->mutex);
    return data;
}

/* 共享缓冲区 */
static BoundedBuffer g_buffer;

/* 生产者线程 */
static void* producer_thread(void *arg) {
    (void)arg;

    for (int i = 1; i <= 10; i++) {
        buffer_put(&g_buffer, i * 10);
        SLEEP_MS(200);  /* 模拟生产耗时 */
    }

    /* 发送结束标记 */
    buffer_put(&g_buffer, -1);
    printf("[生产者] 生产完毕\n");
    return NULL;
}

/* 消费者线程 */
static void* consumer_thread(void *arg) {
    (void)arg;

    while (1) {
        int data = buffer_get(&g_buffer);
        if (data == -1) {
            printf("[消费者] 收到结束标记，退出\n");
            /* 把结束标记放回去给其他消费者 */
            buffer_put(&g_buffer, -1);
            break;
        }
        printf("[消费者] 处理数据: %d\n", data);
        SLEEP_MS(400);  /* 模拟消费耗时（比生产者慢）*/
    }
    return NULL;
}

/* ============================================================================
 * 示例 2: 广播通知（一次性任务）
 *
 * 主线程等待多个工作线程全部就绪，然后一次性广播启动命令。
 * 演示 pthread_cond_broadcast 的用法。
 * ============================================================================
 */

#define NUM_WORKERS 4

static pthread_mutex_t g_start_mutex = PTHREAD_MUTEX_INITIALIZER;
static pthread_cond_t g_start_cond = PTHREAD_COND_INITIALIZER;
static int g_ready_count = 0;      /* 已就绪的线程数 */
static bool g_start_flag = false;  /* 启动标志 */

/* 工作线程 */
static void* worker_thread(void *arg) {
    int id = *(int *)arg;

    SLEEP_MS(100 * id);  /* 每个线程准备时间不同 */

    pthread_mutex_lock(&g_start_mutex);
    g_ready_count++;
    printf("  [工作线程 %d] 已就绪 (%d/%d)\n", id, g_ready_count, NUM_WORKERS);

    if (g_ready_count == NUM_WORKERS) {
        /* 最后一个就绪的线程负责广播启动信号 */
        printf("  [工作线程 %d] 全员就绪，广播启动！\n", id);
        g_start_flag = true;
        pthread_cond_broadcast(&g_start_cond);
    } else {
        /* 还没到齐，等待 */
        while (!g_start_flag) {
            pthread_cond_wait(&g_start_cond, &g_start_mutex);
        }
    }
    pthread_mutex_unlock(&g_start_mutex);

    printf("  [工作线程 %d] 开始执行任务！\n", id);
    return NULL;
}

/* ============================================================================
 * 示例 3: 多生产者-多消费者
 *
 * 3 个生产者、2 个消费者共享一个有界缓冲区。
 * 使用 atomic_bool + broadcast 发送结束信号。
 *
 * 原理：
 *   每个生产者生产完数据后将活跃计数减 1。
 *   消费者检测到队列为空且无活跃生产者时退出。
 *   生产者退出时 broadcast 唤醒消费者，消费者收到后重新检查条件。
 * ============================================================================
 */

#define MPMC_BUFFER_SIZE 6
#define NUM_PRODUCERS 3
#define NUM_CONSUMERS 2

static pthread_mutex_t g_mpmc_mutex = PTHREAD_MUTEX_INITIALIZER;
static pthread_mutex_t g_mpmc_print_lock = PTHREAD_MUTEX_INITIALIZER;
static pthread_cond_t g_mpmc_cond = PTHREAD_COND_INITIALIZER;
static int g_mpmc_buf[MPMC_BUFFER_SIZE];
static int g_mpmc_head = 0;
static int g_mpmc_tail = 0;
static int g_mpmc_count = 0;
static atomic_int g_mpmc_active_producers;

/* 安全打印 */
/* 专用打印锁（不与 g_mpmc_mutex 共用，避免持锁时打印导致的自我死锁）*/
static void mpmc_printf(const char *fmt, ...)
{
    va_list args;
    va_start(args, fmt);
    pthread_mutex_lock(&g_mpmc_print_lock);
    vprintf(fmt, args);
    pthread_mutex_unlock(&g_mpmc_print_lock);
    va_end(args);
}

/* 生产者线程 */
static void* mpmc_producer(void *arg)
{
    int id = *(int *)arg;
    int base = id * 100;

    for (int i = 0; i < 4; i++) {
        int data = base + i;

        pthread_mutex_lock(&g_mpmc_mutex);
        while (g_mpmc_count >= MPMC_BUFFER_SIZE) {
            mpmc_printf("  [生产者%d] 缓冲区满，等待...\n", id);
            /*
            // 步骤 1：原子性地释放 mutex 并进入等待队列
            atomic {
                pthread_mutex_unlock(&g_mpmc_mutex);
                把当前线程放入 g_mpmc_cond 的等待队列;
                阻塞;  // 线程在这里休眠
            }

            // 步骤 2：被唤醒后（收到 signal/broadcast）
            pthread_mutex_lock(&g_mpmc_cond);  // 重新获取 mutex
            // 此时返回调用者
            */
            pthread_cond_wait(&g_mpmc_cond, &g_mpmc_mutex);
        }

        g_mpmc_buf[g_mpmc_tail] = data;
        g_mpmc_tail = (g_mpmc_tail + 1) % MPMC_BUFFER_SIZE;
        g_mpmc_count++;
        mpmc_printf("  [生产者%d] 放入 %d (共 %d 个)\n", id, data, g_mpmc_count);

        /*
         * 在 mutex 内 signal：被唤醒的消费者拿到锁时，
         * 条件一定和自己刚修改的一致（不会被其他消费者插进来把条件又消费掉）
         */
        /*
        条件变化后，只需一个人响应 → signal
        条件变化后，所有等待者都要重新评估 → broadcast

        // 方式 A：signal 在锁内（当前代码）
        pthread_cond_signal(&g_mpmc_cond);    // ① signal
        pthread_mutex_unlock(&g_mpmc_mutex);  // ② 解锁

        // 方式 B：signal 在锁外
        pthread_mutex_unlock(&g_mpmc_mutex);  // ② 解锁
        pthread_cond_signal(&g_mpmc_cond);    // ① signal

        方式 A 的流程：
        生产者：signal → 解锁
        消费者：被唤醒 → 尝试加锁 → 加锁成功 → 处理

        方式 B 的流程：
        生产者：解锁 → signal
        消费者：解锁瞬间就可以加锁 → 处理
                → signal 到达时消费者已经在处理了（浪费一次唤醒，但无害）

        方式 A 中，signal 时锁还在生产者手上，消费者被唤醒后会立即尝试加锁但锁还没释放——消费者可能在内核态阻塞一下等锁。方式 B 中，先解锁再 signal，消费者被唤醒时锁已经可用，能立刻拿到。

        理论上方式 B 略优一点（少一次锁争用），但差别极小。关键的规范要求是：

        只要在修改条件（g_mpmc_count++）和 wait 之间持有锁就行。signal 放在锁内还是锁外都是 POSIX 允许的。
        */
        pthread_cond_signal(&g_mpmc_cond);
        pthread_mutex_unlock(&g_mpmc_mutex);

        SLEEP_MS(200);
    }

    /* 生产结束：在 mutex 内递减活跃计数并 broadcast */
    pthread_mutex_lock(&g_mpmc_mutex);
    atomic_fetch_sub(&g_mpmc_active_producers, 1);
    mpmc_printf("  [生产者%d] 生产完毕 (剩余 %d 个活跃生产者)\n",
                id, atomic_load(&g_mpmc_active_producers));
    pthread_cond_broadcast(&g_mpmc_cond);
    pthread_mutex_unlock(&g_mpmc_mutex);

    return NULL;
}

/* 消费者线程 */
static void* mpmc_consumer(void *arg)
{
    int id = *(int *)arg;

    while (1) {
        pthread_mutex_lock(&g_mpmc_mutex);

        /*
         * 等待条件：队列非空，或还有活跃生产者（可能即将生产）
         * 只有当队列为空 且 所有生产者都结束，才退出
         */
        while (g_mpmc_count == 0 && atomic_load(&g_mpmc_active_producers) > 0) {
            mpmc_printf("  [消费者%d] 队列空，等待生产...\n", id);
            pthread_cond_wait(&g_mpmc_cond, &g_mpmc_mutex);
        }

        /* 队列空且无活跃生产者 → 结束 */
        if (g_mpmc_count == 0 && atomic_load(&g_mpmc_active_producers) == 0) {
            pthread_mutex_unlock(&g_mpmc_mutex);
            break;
        }

        int data = g_mpmc_buf[g_mpmc_head];
        g_mpmc_head = (g_mpmc_head + 1) % MPMC_BUFFER_SIZE;
        g_mpmc_count--;
        mpmc_printf("  [消费者%d] 取出 %d (剩余 %d 个)\n", id, data, g_mpmc_count);

        /*
        经典观点：锁外 signal 略优

        锁内 signal 的额外开销：

        生产者：signal(cond)
        消费者：被唤醒 → 尝试加锁 → 锁还被生产者拿着 → 又睡回去 😴
        生产者：解锁(mutex)
        消费者：再被唤醒 → 拿到锁 ✅

        多了一次 睡→醒 的乒乓！(2 次上下文切换)

        锁外 signal 则避免了这步：

        生产者：解锁(mutex)
        消费者：拿到锁 ✅ 开始处理  ← 消费者醒来就能干活
        生产者：signal(cond)       ← 这时的 signal 相当于"无事可做"的广播

        所以传统建议是：锁外 signal 少一次无谓的上下文切换。


        但现代实现上没那么简单
        Linux NPTL（Native POSIX Thread Library）：锁内 signal 时，消费者虽然拿不到锁，但 futex 机制会做锁移交（lock handoff）——把锁直接递给被唤醒的消费者，而不是让生产者一个个去争。这种情况下消费者不会真的睡过去又醒来，反而比锁外 signal 更快。
        多核 CPU：消费者被唤醒后可能在另一个核心上自旋等待锁释放，不经过内核调度，开销极小。


                        单核 / 老系统           多核 / 现代 Linux
        ──────────────  ─────────────────────  ───────────────────────
        signal 在锁内	⚠️ 多一次上下文切换     ✅ 锁移交，有时更快
        signal 在锁外	✅ 少一次切换           ✅ 也 OK

        差别在微秒级，99% 的应用不用在意这个。 真正重要的是：
        signal/broadcast 必须在条件修改之后调用（这个错了就丢唤醒）
        至于放锁内还是锁外，选一种风格保持一致就行

        */
        pthread_mutex_unlock(&g_mpmc_mutex);
        pthread_cond_signal(&g_mpmc_cond);

        SLEEP_MS(300);
    }

    mpmc_printf("  [消费者%d] 退出\n", id);
    return NULL;
}

void demo_multi_pc(void)
{
    printf("------ 示例 3: 多生产者-多消费者 -----\n\n");
    printf("  生产者: %d 个, 消费者: %d 个\n", NUM_PRODUCERS, NUM_CONSUMERS);
    printf("  缓冲区大小: %d\n\n", MPMC_BUFFER_SIZE);

    atomic_store(&g_mpmc_active_producers, NUM_PRODUCERS);

    pthread_t producers[NUM_PRODUCERS];
    pthread_t consumers[NUM_CONSUMERS];
    int prod_ids[NUM_PRODUCERS];
    int cons_ids[NUM_CONSUMERS];

    for (int i = 0; i < NUM_PRODUCERS; i++) {
        prod_ids[i] = i + 1;
        pthread_create(&producers[i], NULL, mpmc_producer, &prod_ids[i]);
    }
    for (int i = 0; i < NUM_CONSUMERS; i++) {
        cons_ids[i] = i + 1;
        pthread_create(&consumers[i], NULL, mpmc_consumer, &cons_ids[i]);
    }

    for (int i = 0; i < NUM_PRODUCERS; i++)
        pthread_join(producers[i], NULL);
    for (int i = 0; i < NUM_CONSUMERS; i++)
        pthread_join(consumers[i], NULL);

    printf("\n  多生产者-多消费者示例结束。\n\n");
}

/* ============================================================================
 * 示例 4: 虚假唤醒 (Spurious Wakeup) 演示
 *
 * 展示为什么必须用 while 循环而不是 if 检查条件。
 * Linux 上虽然极少发生，但 POSIX 标准允许虚假唤醒。
 * ============================================================================
 */

static pthread_mutex_t g_spurious_mutex = PTHREAD_MUTEX_INITIALIZER;
static pthread_cond_t g_spurious_cond = PTHREAD_COND_INITIALIZER;
static int g_spurious_data = 0;

__attribute__((unused)) static void* spurious_demo(void *arg) {
    (void)arg;

    pthread_mutex_lock(&g_spurious_mutex);

    /* ❌ 错误写法：用 if */
    if (g_spurious_data == 0) {
        printf("  [等待线程] 条件不满足，进入等待\n");
        pthread_cond_wait(&g_spurious_cond, &g_spurious_mutex);
        /* 虚假唤醒后可能 g_spurious_data 仍然是 0！*/
    }
    /* 如果被虚假唤醒，这里会错误地认为数据准备好了 */
    printf("  [等待线程] 被唤醒，g_spurious_data = %d\n", g_spurious_data);

    pthread_mutex_unlock(&g_spurious_mutex);
    return NULL;
}


/* ============================================================================
 * 主函数
 * ============================================================================
 */
int main(void) {
    pthread_t threads[16];
    int ret;

    printf("============================================\n");
    printf("  条件变量 (Condition Variable) 示例\n");
    printf("============================================\n");

    /* ----------------------------------------------------------------
     * 示例 1: 生产者-消费者
     * ---------------------------------------------------------------- */
    printf("\n====== 示例 1: 生产者-消费者 (有界缓冲区) ======\n\n");

    buffer_init(&g_buffer);

    pthread_t producer, consumer;
    pthread_create(&producer, NULL, producer_thread, NULL);
    pthread_create(&consumer, NULL, consumer_thread, NULL);

    pthread_join(producer, NULL);
    pthread_join(consumer, NULL);
    buffer_destroy(&g_buffer);

    printf("\n生产者-消费者示例结束。\n");

    /* ----------------------------------------------------------------
     * 示例 2: 广播通知（所有线程同时开始）
     * ---------------------------------------------------------------- */
    printf("\n====== 示例 2: 广播通知 (pthread_cond_broadcast) ======\n\n");

    int worker_ids[NUM_WORKERS];
    for (int i = 0; i < NUM_WORKERS; i++) {
        worker_ids[i] = i + 1;
        ret = pthread_create(&threads[i], NULL, worker_thread, &worker_ids[i]);
        if (ret != 0) {
            fprintf(stderr, "创建工作线程 %d 失败\n", i + 1);
            exit(1);
        }
    }

    for (int i = 0; i < NUM_WORKERS; i++) {
        pthread_join(threads[i], NULL);
    }

    /* ----------------------------------------------------------------
     * 示例 3: 多生产者-多消费者
     * ---------------------------------------------------------------- */
    printf("\n====== 示例 3: 多生产者-多消费者 ======\n");
    demo_multi_pc();

    /* ----------------------------------------------------------------
     * 示例 4: 为什么必须用 while 而不是 if
     * ---------------------------------------------------------------- */
    printf("\n====== 示例 4: 虚假唤醒说明 ======\n\n");

    printf("POSIX 标准规定:\n");
    printf("  pthread_cond_wait 即使没有收到 signal 也可能返回\n");
    printf("  这称为虚假唤醒 (Spurious Wakeup)\n\n");
    printf("因此等待条件时:\n");
    printf("  ✅ 正确: while (条件不满足) { pthread_cond_wait(&cond, &mutex); }\n");
    printf("  ❌ 错误: if (条件不满足) { pthread_cond_wait(&cond, &mutex); }\n\n");
    printf("while 循环会在被唤醒后重新检查条件，\n");
    printf("如果条件仍然不满足则继续等待。\n\n");

    /* ===== 使用注意事项 ===== */
    printf("\n============================================\n");
    printf("  使用条件变量的注意事项\n");
    printf("============================================\n\n");

    printf("1. 始终在 while 循环中检查条件\n");
    printf("   - 防止虚假唤醒\n");
    printf("   - 防止多个消费者被同一个 signal 唤醒\n\n");

    printf("2. pthread_cond_wait 的原子语义:\n");
    printf("   调用 wait 时自动: 解锁 mutex → 阻塞等待\n");
    printf("   被唤醒时自动: 重新加锁 mutex → 返回\n\n");

    printf("3. signal 与 broadcast 的选择:\n");
    printf("   - signal: 只唤醒一个等待线程（高效）\n");
    printf("   - broadcast: 唤醒所有等待线程（确保所有线程都能响应）\n\n");

    printf("4. 先修改条件，再发送信号:\n");
    printf("   必须先修改共享数据（条件），再调用 signal/broadcast\n\n");

    printf("5. 使用前初始化，使用后销毁\n\n");

    printf("============================================\n");
    printf("  程序结束\n");
    printf("============================================\n");

    return 0;
}
