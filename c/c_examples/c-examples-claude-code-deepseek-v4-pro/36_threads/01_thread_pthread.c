/*
 * ============================================
 * 知识点：线程编程 — POSIX 线程 (pthreads)
 * 说明：
 *   线程允许程序同时执行多个任务。
 *   pthreads 是 POSIX 标准线程 API，
 *   广泛用于 Linux/macOS/Unix 系统。
 *
 *   核心函数：
 *   pthread_create()  — 创建线程
 *   pthread_join()    — 等待线程结束
 *   pthread_mutex_lock/unlock — 互斥锁
 *
 *   编译方法：
 *   Linux/macOS: gcc 01_thread_pthread.c -o 01_thread_pthread -lpthread
 *   Windows:     使用 WSL 或在 MinGW 中安装 mingw-pthreads
 *   MinGW:       gcc 01_thread_pthread.c -o 01_thread_pthread -lpthread
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <pthread.h>   // POSIX 线程
#include <unistd.h>    // usleep, sleep

// ========== 工具函数 ==========
void msleep(int ms) { usleep(ms * 1000); }

// ========== 共享数据结构 ==========
typedef struct {
    int start;
    int end;
    long long result;
} ThreadData;

// 互斥锁
pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;

// ========== 1. 基本线程 ==========
/*
 * 线程函数签名：void* func(void* arg)
 */
void* thread_simple(void *arg) {
    int thread_id = *(int*)arg;
    printf("  线程 %d 启动\n", thread_id);

    for (int i = 0; i < 3; i++) {
        printf("  线程 %d: 工作中... (%d)\n", thread_id, i + 1);
        msleep(200);
    }

    printf("  线程 %d 结束\n", thread_id);
    return NULL;
}

void basic_thread_demo(void) {
    printf("--- 基本线程创建 ---\n");

    pthread_t t1, t2;
    int id1 = 1, id2 = 2;

    if (pthread_create(&t1, NULL, thread_simple, &id1) != 0) {
        perror("创建线程1失败");
        return;
    }
    if (pthread_create(&t2, NULL, thread_simple, &id2) != 0) {
        perror("创建线程2失败");
        return;
    }

    printf("主线程: 等待子线程结束...\n");
    pthread_join(t1, NULL);
    pthread_join(t2, NULL);
    printf("主线程: 所有子线程已结束\n\n");
}

// ========== 2. 多线程分段求和 ==========
void* thread_sum(void *arg) {
    ThreadData *data = (ThreadData*)arg;

    data->result = 0;
    for (int i = data->start; i <= data->end; i++) {
        data->result += i;
    }

    printf("  线程求和 [%d~%d] = %lld\n",
           data->start, data->end, data->result);
    return NULL;
}

void threaded_sum_demo(void) {
    printf("--- 多线程分段求和 ---\n");

    int total = 10000000;
    int num_threads = 4;
    pthread_t threads[4];
    ThreadData data[4];

    int chunk = total / num_threads;
    clock_t start = clock();

    for (int i = 0; i < num_threads; i++) {
        data[i].start = i * chunk + 1;
        data[i].end = (i == num_threads - 1) ? total : (i + 1) * chunk;
        data[i].result = 0;

        if (pthread_create(&threads[i], NULL,
                          thread_sum, &data[i]) != 0) {
            perror("创建线程失败");
            return;
        }
    }

    long long total_sum = 0;
    for (int i = 0; i < num_threads; i++) {
        pthread_join(threads[i], NULL);
        total_sum += data[i].result;
    }

    clock_t end = clock();
    double time_spent = (double)(end - start) / CLOCKS_PER_SEC;

    printf("总和 1~%d = %lld\n", total, total_sum);
    printf("用时: %.4f 秒 (4线程并行)\n\n", time_spent);
}

// ========== 3. 互斥锁 ==========
long long shared_counter = 0;
#define ITERATIONS 100000

void* thread_unsafe(void *arg) {
    (void)arg;
    for (int i = 0; i < ITERATIONS; i++) {
        shared_counter++;  // 不安全！数据竞争
    }
    return NULL;
}

void* thread_safe(void *arg) {
    (void)arg;
    for (int i = 0; i < ITERATIONS; i++) {
        pthread_mutex_lock(&mutex);
        shared_counter++;  // 加锁保护
        pthread_mutex_unlock(&mutex);
    }
    return NULL;
}

void mutex_demo(void) {
    printf("--- 互斥锁演示 ---\n");
    pthread_t t1, t2;

    // 不安全版本
    shared_counter = 0;
    printf("不加锁 (数据竞争):\n");
    pthread_create(&t1, NULL, thread_unsafe, NULL);
    pthread_create(&t2, NULL, thread_unsafe, NULL);
    pthread_join(t1, NULL);
    pthread_join(t2, NULL);
    printf("  期望: %d, 实际: %lld (可能不正确)\n",
           2 * ITERATIONS, shared_counter);

    // 安全版本
    shared_counter = 0;
    printf("加锁保护:\n");
    pthread_create(&t1, NULL, thread_safe, NULL);
    pthread_create(&t2, NULL, thread_safe, NULL);
    pthread_join(t1, NULL);
    pthread_join(t2, NULL);
    printf("  期望: %d, 实际: %lld (正确)\n",
           2 * ITERATIONS, shared_counter);
    printf("\n");
}

// ========== 4. 工作线程池 ==========
void* thread_worker(void *arg) {
    int id = *(int*)arg;
    printf("  工作者 %d: 开始任务\n", id);
    msleep(500 + id * 100);
    printf("  工作者 %d: 任务完成\n", id);
    return NULL;
}

void worker_pool_demo(void) {
    printf("--- 工作线程池 ---\n");

    int num_workers = 4;
    pthread_t workers[4];
    int ids[4];

    for (int i = 0; i < num_workers; i++) {
        ids[i] = i + 1;
        pthread_create(&workers[i], NULL, thread_worker, &ids[i]);
    }

    printf("主线程: 等待所有工作者完成...\n");
    for (int i = 0; i < num_workers; i++) {
        pthread_join(workers[i], NULL);
        printf("主线程: 工作者 %d 已回收\n", ids[i]);
    }
    printf("主线程: 所有任务完成\n\n");
}

// ========== main ==========
int main(void) {
    printf("===== 线程编程 (pthreads) =====\n\n");

    basic_thread_demo();
    threaded_sum_demo();
    mutex_demo();
    worker_pool_demo();

    pthread_mutex_destroy(&mutex);

    printf("===== 线程编程总结 =====\n");
    printf("核心函数:\n");
    printf("  pthread_create()  — 创建线程\n");
    printf("  pthread_join()    — 等待线程结束\n");
    printf("  pthread_mutex_lock/unlock — 互斥锁\n");
    printf("\n注意事项:\n");
    printf("  1. 共享数据需要加锁保护\n");
    printf("  2. 多个锁时注意锁顺序，避免死锁\n");
    printf("  3. 编译需链接 -lpthread\n");
    printf("  4. Windows 用 WSL 或 mingw-pthreads\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. pthread_create 创建线程，pthread_join 等待
 * 2. 互斥锁保护共享数据，避免数据竞争
 * 3. 多线程可提升计算密集型任务性能
 * 4. 注意死锁：多个锁的加锁顺序要一致
 * 5. 传参要确保参数在子线程生命周期内有效
 * 6. 编译: gcc file.c -o file -lpthread
 * ============================================
 */
