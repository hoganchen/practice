/*
 * 知识点：使用 pthreads 创建线程 (Creating Threads)
 *
 * 编译指令：gcc 01_thread_basics.c -o 01_thread_basics.exe -std=c11 -Wall -lpthread
 * 运行指令：./01_thread_basics.exe
 *
 * 本文件演示 POSIX 线程 (pthreads) 的基本使用：
 *   - pthread_create()   —— 创建新线程
 *   - pthread_join()     —— 等待线程结束
 *   - pthread_self()     —— 获取当前线程 ID
 *   - 线程函数的签名：void *thread_func(void *arg)
 *   - 向线程传递参数和获取返回值
 *
 * 注意：
 *   - pthreads 在 Linux、macOS 上原生支持
 *   - Windows 需要 MinGW-w64 或 cygwin 编译环境
 *   - 编译时需链接 pthread 库：-lpthread（Windows 上可能为 -lpthreadGC2）
 *   - 线程函数的返回值通过 pthread_join 获取
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

/* ===== 线程数据结构 ===== */

/* 传递给线程的参数结构体 */
typedef struct {
    int thread_id;      /* 线程编号 */
    const char *name;   /* 线程名称 */
    int iterations;     /* 迭代次数 */
} ThreadArgs;

/* 线程返回的结果结构体 */
typedef struct {
    int thread_id;
    long long sum;
    double elapsed_time;
} ThreadResult;

/* ===== 线程函数 ===== */

/**
 * 线程函数1：简单的打印任务
 * 线程函数必须接收 void* 参数并返回 void*
 * 参数 arg: 可指向任意类型的数据
 */
void *print_task(void *arg) {
    /* 将 void* 参数转换为实际类型 */
    int thread_num = *(int *)arg;

    printf("  [线程 %d] 开始执行...\n", thread_num);

    /* 获取当前线程的 ID */
    pthread_t tid = pthread_self();
    printf("  [线程 %d] 我的线程 ID: %lu\n", thread_num, (unsigned long)tid);

    /* 模拟一些工作 */
    for (int i = 1; i <= 3; i++) {
        printf("  [线程 %d] 工作进度 %d/3\n", thread_num, i);
        SLEEP_MS(500);  /* 睡眠 500 毫秒 */
    }

    printf("  [线程 %d] 执行完毕。\n", thread_num);

    return NULL;  /* 线程返回 NULL */
}

/**
 * 线程函数2：计算任务，使用结构体传递参数和结果
 * 参数 arg: 指向 ThreadArgs 结构体
 * 返回值: 指向 ThreadResult 结构体（需在堆上分配）
 */
void *compute_task(void *arg) {
    /* 转换参数 */
    ThreadArgs *args = (ThreadArgs *)arg;

    printf("  [线程 %d - %s] 开始计算...\n",
           args->thread_id, args->name);

    /* 分配结果结构体（在堆上，这样退出线程后仍然有效） */
    ThreadResult *result = (ThreadResult *)malloc(sizeof(ThreadResult));
    if (result == NULL) {
        return NULL;
    }

    result->thread_id = args->thread_id;
    result->sum = 0;

    /* 执行计算：累加 1 到 iterations */
    for (int i = 1; i <= args->iterations; i++) {
        result->sum += i;
        /* 每四分之一进度打印一次 */
        if (i % (args->iterations / 4) == 0) {
            printf("  [线程 %d - %s] 进度 %d%%\n",
                   args->thread_id, args->name,
                   (i * 100) / args->iterations);
            SLEEP_MS(200);
        }
    }

    printf("  [线程 %d - %s] 计算完成！结果 = %lld\n",
           args->thread_id, args->name, result->sum);

    /* 返回结果（通过堆上分配的内存） */
    return result;
}

/* ===== 主函数 ===== */
/*
pthread_create 的完整签名：
int pthread_create(pthread_t *thread,            // [out] 线程ID
                   const pthread_attr_t *attr,   // [in]  线程属性 (第二个参数)
                   void *(*start_routine)(void*),// [in]  线程函数
                   void *arg);                   // [in]  传给函数的参数

第二个参数 attr 的作用
设置线程的属性。传 NULL 表示使用默认属性，绝大多数情况都够用。需要自定义时，它控制以下内容：

属性            说明
──────────────  ──────────────────────────────────────────────────────────────────────────────────────────────────
detachstate     线程是否为"分离状态" — PTHREAD_CREATE_JOINABLE（默认，可被 join）或 PTHREAD_CREATE_DETACHED（自动释放资源，不可 join）
stacksize       线程栈大小（字节），默认通常 8MB，可调小以节省内存或调大防栈溢出
stackaddr       自定义栈的地址（极少用）
schedpolicy     调度策略：SCHED_OTHER（默认分时）、SCHED_FIFO（实时先入先出）、SCHED_RR（实时轮转）
schedparam      调度优先级（配合实时策略使用）
inheritsched    调度属性是继承自创建线程还是显式设置
scope           竞争范围：PTHREAD_SCOPE_SYSTEM（与系统所有线程竞争）或 PTHREAD_SCOPE_PROCESS（仅与进程内线程竞争）

使用流程
需要自定义时，三步走：
pthread_attr_t attr;
pthread_attr_init(&attr);                              // 1. 初始化

pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED);  // 2. 设属性
pthread_attr_setstacksize(&attr, 1024 * 1024);         //    设栈大小 1MB

pthread_create(&thread, &attr, func, arg);             // 3. 创建线程
pthread_attr_destroy(&attr);                           // 4. 用完销毁

最常见的使用场景
// 场景 A：默认（99% 的情况）
pthread_create(&thread, NULL, func, arg);

// 场景 B：分离线程（创建即分离，无需 join）
pthread_attr_t attr;
pthread_attr_init(&attr);
pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED);
pthread_create(&thread, &attr, func, arg);
pthread_attr_destroy(&attr);

一句话：attr 就是线程的"配置对象"——传 NULL 用默认配置就行，想调栈大小、设分离状态、改调度策略时才需要专门设置它。
*/
int main() {
    printf("============================================\n");
    printf("  pthreads 线程基础演示\n");
    printf("============================================\n\n");

    /* ===== 1. 创建简单线程 ===== */
    printf("----- 1. 创建和等待线程 -----\n");

    pthread_t thread1;
    int arg1 = 1;  /* 传递给线程的参数 */

    /* pthread_create(线程ID, 属性, 线程函数, 参数) */
    /*
    线程函数的固定签名
    C 语言（POSIX threads）的线程函数必须是这样一个固定格式：
    void *thread_function(void *arg);

    参数：void *arg — 一个万能指针，可以指向任意类型的数据
    返回值：void * — 同样万能，可以返回任意类型的数据（或 NULL）

    三条铁律
    规则            说明
    ──────────────  ──────────────────────────────────────────────────────────────────────────────────
    签名固定        必须是 void *func(void *arg)，名字任意
    参数存活        传给线程的参数的内存必须在线程使用期间有效 — 不能用即将出栈的局部变量传给 detach 的线程
    返回值存活      返回值必须用 malloc 分配或位于静态区，不能是函数内的局部变量（出栈就没了）
    这也是 void* 被称为"万能插头"的原因 — 通过结构体可以打包任意复杂的数据传入传出。
    */
    int ret = pthread_create(&thread1, NULL, print_task, &arg1);
    if (ret != 0) {
        fprintf(stderr, "创建线程失败！错误码: %d, 描述: %s\n",
                ret, strerror(ret));
        return 1;
    }

    printf("主线程: 已创建线程 1，等待它完成...\n");

    /* pthread_join 等待指定线程结束
     * 第二个参数可以获取线程的返回值 */
    ret = pthread_join(thread1, NULL);
    if (ret != 0) {
        fprintf(stderr, "等待线程失败！错误码: %d\n", ret);
    }

    printf("主线程: 线程 1 已完成。\n\n");

    /* ===== 2. 使用结构体传参和获取返回值 ===== */
    printf("----- 2. 传递复杂参数和获取返回值 -----\n");

    pthread_t thread2;
    ThreadArgs args2;
    args2.thread_id = 2;
    args2.name = "计算器";
    args2.iterations = 10000000;  /* 1 千万次迭代 */

    ret = pthread_create(&thread2, NULL, compute_task, &args2);
    if (ret != 0) {
        fprintf(stderr, "创建线程 2 失败！\n");
        return 1;
    }

    /* 等待线程完成并获取其返回值 */
    void *thread_ret = NULL;
    ret = pthread_join(thread2, &thread_ret);
    if (ret != 0) {
        fprintf(stderr, "等待线程 2 失败！\n");
    } else {
        /* 将 void* 转换回 ThreadResult* */
        ThreadResult *res = (ThreadResult *)thread_ret;
        if (res != NULL) {
            printf("主线程: 线程 %d 返回结果\n", res->thread_id);
            printf("  1 + 2 + ... + %d = %lld\n",
                   args2.iterations, res->sum);
            /* 释放线程中分配的内存 */
            free(res);  // free(thread_ret)
        }
    }

    printf("\n");

    /* ===== 3. 创建多个线程并行执行 ===== */
    printf("----- 3. 多个线程并行执行 -----\n");

    #define NUM_THREADS 4
    pthread_t threads[NUM_THREADS];
    ThreadArgs args[NUM_THREADS];

    printf("创建 %d 个线程，它们将并发执行...\n", NUM_THREADS);

    for (int i = 0; i < NUM_THREADS; i++) {
        args[i].thread_id = i + 1;
        args[i].name = "并发任务";
        args[i].iterations = (i + 1) * 5000000;  /* 不同线程不同工作量 */

        ret = pthread_create(&threads[i], NULL, compute_task, &args[i]);
        if (ret != 0) {
            fprintf(stderr, "创建线程 %d 失败！\n", i + 1);
        }
    }

    /* 等待所有线程完成 */
    printf("\n主线程: 等待所有线程完成...\n");
    for (int i = 0; i < NUM_THREADS; i++) {
        void *ret_val = NULL;
        pthread_join(threads[i], &ret_val);
        if (ret_val != NULL) {
            ThreadResult *res = (ThreadResult *)ret_val;
            printf("  线程 %d 完成，结果 = %lld\n",
                   res->thread_id, res->sum);
            free(ret_val);
        }
    }

    printf("\n所有线程已完成。\n");

    /* ===== 4. 注意事项 ===== */
    printf("\n----- 4. 使用注意事项 -----\n");

    printf("1) 传递给线程的参数必须在线程访问时仍然有效\n");
    printf("   （不要传递局部变量的地址给 detach 的线程）\n");
    printf("2) 线程的返回值必须是 malloc 分配的或在静态区\n");
    printf("3) 必须使用 pthread_join 等待线程结束，否则会内存泄漏\n");
    printf("4) 线程错误码用 strerror() 获取描述\n");
    printf("5) 线程函数必须是 void* func(void*) 签名\n");

    printf("\n============================================\n");
    printf("  程序结束\n");
    printf("============================================\n");

    return 0;
}
