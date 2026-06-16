/*
 * 知识点：时间和日期函数 (Time and Date Functions)
 *
 * 编译指令：gcc 03_time_and_date.c -o 03_time_and_date.exe -std=c11 -Wall
 * 运行指令：./03_time_and_date.exe
 *
 * 本文件演示 <time.h> 中的时间和日期操作：
 *   - time()         —— 获取当前日历时间（time_t 类型，自 1970-01-01 的秒数）
 *   - clock()        —— 获取程序消耗的 CPU 时钟周期
 *   - difftime()     —— 计算两个 time_t 的时间差（秒）
 *   - localtime()    —— 将 time_t 转换为本地时间的 struct tm
 *   - gmtime()       —— 将 time_t 转换为 UTC 时间的 struct tm
 *   - mktime()       —— 将 struct tm 转换回 time_t
 *   - strftime()     —— 格式化时间输出
 *   - ctime()        —— 将 time_t 转换为可读字符串（简单但不安全）
 *   - clock_gettime() —— 高精度时间（POSIX 扩展，非 C11 标准）
 */

#include "../common/charset.h"
#include <stdio.h>
#include <time.h>
#include <math.h>  /* 用于模拟计算任务 */

/* 定义圆周率常量（如果未定义）*/
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

/* 模拟一个耗时计算（计算 π 的近似值） */
double compute_pi(long long iterations) {
    double pi = 0.0;
    int sign = 1;
    for (long long i = 0; i < iterations; i++) {
        /* 使用莱布尼茨级数：π/4 = 1 - 1/3 + 1/5 - 1/7 + ... */
        pi += sign * 1.0 / (2.0 * i + 1.0);
        sign = -sign;
    }
    return pi * 4.0;
}

/* 格式化输出 struct tm 中的信息 */
void print_tm_info(const struct tm *t, const char *label) {
    printf("--- %s ---\n", label);
    printf("  年: %d  (1900 年起)\n",   t->tm_year);
    printf("  月: %d  (0=1月)\n",       t->tm_mon);
    printf("  日: %d\n",                t->tm_mday);
    printf("  时: %d\n",                t->tm_hour);
    printf("  分: %d\n",                t->tm_min);
    printf("  秒: %d\n",                t->tm_sec);
    printf("  星期: %d (0=周日)\n",     t->tm_wday);
    printf("  一年中的第 %d 天\n",       t->tm_yday);
    printf("  夏令时: %s\n",            t->tm_isdst ? "是" : "否");
    printf("\n");
}

int main() {
    printf("============================================\n");
    printf("  时间和日期函数演示 (<time.h>)\n");
    printf("============================================\n\n");

    /* ===== 1. 获取当前时间 ===== */
    printf("----- 1. 当前时间 -----\n");

    /* time(NULL) 返回当前日历时间（time_t 类型）
     * time_t 通常是一个 64 位整数，表示自 1970-01-01 00:00:00 UTC 以来的秒数
     * 也可通过传入 time_t* 参数获取值 */
    time_t now = time(NULL);
    if (now == (time_t)-1) {
        printf("获取时间失败！\n");
        return 1;
    }

    printf("当前时间戳 (time_t): %lld 秒\n", (long long)now);
    printf("从 1970-01-01 至今已过去了约 %.2f 年\n",
           (double)now / (365.25 * 24 * 3600));

    /* ctime() 直接将 time_t 转为字符串（包含换行符） */
    printf("当前时间 (ctime): %s", ctime(&now));

    /* ===== 2. time_t 与 struct tm 的转换 ===== */
    printf("\n----- 2. 时间转换 -----\n");

    /* localtime(): 将 time_t 转换为本地时间的 struct tm */
    struct tm *local_tm = localtime(&now);
    if (local_tm == NULL) {
        printf("转换本地时间失败！\n");
        return 1;
    }
    print_tm_info(local_tm, "本地时间 (localtime)");

    /* gmtime(): 将 time_t 转换为 UTC 时间的 struct tm */
    struct tm *utc_tm = gmtime(&now);
    if (utc_tm == NULL) {
        printf("转换 UTC 时间失败！\n");
        return 1;
    }
    print_tm_info(utc_tm, "UTC 时间 (gmtime)");

    /* 注意：localtime 和 gmtime 返回指向静态变量的指针
     * 每次调用都会覆盖上一次的结果！如需保留，应拷贝 */
    struct tm local_copy = *local_tm;  /* 拷贝一份 */
    (void)local_copy;  /* 抑制未使用警告 */

    /* ===== 3. 格式化输出 strftime ===== */
    printf("----- 3. strftime 格式化输出 -----\n");

    char buffer[256];

    /* strftime 类似 printf，但用于格式化时间 */
    strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", local_tm);
    printf("标准格式:  %s\n", buffer);

    strftime(buffer, sizeof(buffer), "%Y 年 %m 月 %d 日 %H 时 %M 分 %S 秒", local_tm);
    printf("中文格式:  %s\n", buffer);

    strftime(buffer, sizeof(buffer), "%A, %B %d, %Y", local_tm);
    printf("英文格式:  %s\n", buffer);

    strftime(buffer, sizeof(buffer), "%Y%m%d_%H%M%S", local_tm);
    printf("文件名格式: %s\n", buffer);

    strftime(buffer, sizeof(buffer), "%c", local_tm);
    printf("系统默认:  %s\n", buffer);

    /* ===== 4. mktime: 将 struct tm 转回 time_t ===== */
    printf("\n----- 4. mktime 反向转换 -----\n");

    /* 构造一个特定的时间：2024-01-01 00:00:00 */
    struct tm target_tm = {0};
    target_tm.tm_year = 2024 - 1900;  /* 年份从 1900 开始 */
    target_tm.tm_mon  = 0;             /* 月份从 0 开始 (0=一月) */
    target_tm.tm_mday = 1;
    target_tm.tm_hour = 0;
    target_tm.tm_min  = 0;
    target_tm.tm_sec  = 0;

    time_t target = mktime(&target_tm);
    if (target == (time_t)-1) {
        printf("mktime 转换失败！\n");
    } else {
        printf("2024-01-01 00:00:00 的时间戳: %lld\n", (long long)target);
        printf("距离现在: %.0f 秒\n", difftime(now, target));
        printf("距离现在: %.2f 天\n", difftime(now, target) / 86400.0);
    }

    /* ===== 5. difftime: 计算时间差 ===== */
    printf("\n----- 5. difftime 计算时间差 -----\n");

    printf("当前时间戳: %lld\n", (long long)now);
    printf("1 小时后的时间戳: %lld\n", (long long)(now + 3600));
    printf("相差: %.0f 秒\n", difftime(now + 3600, now));

    /* ===== 6. clock: 测量程序执行时间 ===== */
    printf("\n----- 6. clock() 测量程序执行时间 -----\n");

    /* clock() 返回程序启动以来消耗的 CPU 时钟周期数
     * CLOCKS_PER_SEC 是每秒的时钟周期数（通常为 1000） */
    clock_t start = clock();

    /* 执行一些计算密集型任务 */
    printf("正在计算 π 的近似值（可能需要几秒钟）...\n");
    double pi = compute_pi(50000000);  /* 5000 万次迭代 */

    clock_t end = clock();

    /* 计算经过的 CPU 时间（秒） */
    double cpu_time = (double)(end - start) / CLOCKS_PER_SEC;

    printf("计算结果: π ≈ %.15f\n", pi);
    printf("标准值:   π ≈ %.15f\n", M_PI);
    printf("误差:     %.15f\n", fabs(pi - M_PI));
    printf("CPU 耗时: %.3f 秒\n", cpu_time);

    /* 注意：clock() 测量的是 CPU 时间，而非墙上时间
     * 在多线程或睡眠时，clock() 不会增加 */

    /* ===== 7. sleep 函数（C11 标准） ===== */
    printf("\n----- 7. timespec 和 nanosleep (C11) -----\n");

    printf("暂停 500 毫秒...\n");

    /* C11 提供了 struct timespec 用于高精度时间
     * 配合 nanosleep() 可实现精确延时 */
    struct timespec ts;
    ts.tv_sec  = 0;          /* 秒 */
    ts.tv_nsec = 500000000;  /* 纳秒 (0.5 秒) */

    struct timespec remaining;
    /* nanosleep 可能会被信号中断，remaining 返回剩余时间 */
    if (nanosleep(&ts, &remaining) == 0) {
        printf("延时完成。\n");
    } else {
        printf("延时被中断，剩余: %ld.%09ld 秒\n",
               (long)remaining.tv_sec, remaining.tv_nsec);
    }

    printf("\n============================================\n");
    printf("  程序结束\n");
    printf("============================================\n");

    return 0;
}
