/*
 * ============================================
 * 知识点：日期与时间 <time.h>
 * 说明：
 *   <time.h> 提供了处理日期和时间的函数和类型。
 *
 * 核心概念：
 *   time_t     — 从1970-01-01 00:00:00 UTC 起经过的秒数
 *   struct tm  — 分解的时间结构体
 *   clock_t    — CPU 时钟周期数
 *
 * 常用函数：
 *   time()        — 获取当前时间戳
 *   localtime()   — 时间戳 → 本地时间（struct tm）
 *   gmtime()      — 时间戳 → UTC 时间
 *   mktime()      — struct tm → 时间戳
 *   strftime()    — 格式化时间输出
 *   difftime()    — 计算时间差
 *   clock()       — 获取程序 CPU 时间
 *   ctime()       — 时间戳 → 可读字符串
 *
 * 编译方法：
 *   gcc 01_date_time.c -o 01_date_time
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <time.h>   // 时间函数
#include <string.h> // strcpy

int main() {
    // ========== 1. 获取当前时间 ==========
    printf("===== 当前时间 =====\n");

    // time_t 是一个整数类型（通常是 long）
    time_t now = time(NULL);  // 获取当前时间戳

    // ctime 返回静态分配的字符串（包含换行符）
    printf("时间戳 (time_t): %ld\n", (long)now);
    printf("当前时间 (ctime): %s", ctime(&now));

    // ========== 2. struct tm — 分解时间 ==========
    printf("\n===== struct tm 分解时间 =====\n");

    struct tm *local = localtime(&now);
    /*
     * struct tm 包含以下成员：
     * tm_sec    — 秒 (0-59)
     * tm_min    — 分 (0-59)
     * tm_hour   — 时 (0-23)
     * tm_mday   — 日 (1-31)
     * tm_mon    — 月 (0-11, 需要加1)
     * tm_year   — 年 (从 1900 开始的偏移)
     * tm_wday   — 星期几 (0=周日, 6=周六)
     * tm_yday   — 年中第几天 (0-365)
     * tm_isdst  — 夏令时标志
     */

    printf("当前本地时间:\n");
    printf("  %d年%02d月%02d日\n",
           local->tm_year + 1900,
           local->tm_mon + 1,
           local->tm_mday);
    printf("  %02d:%02d:%02d\n",
           local->tm_hour,
           local->tm_min,
           local->tm_sec);

    const char *weekdays[] = {"日", "一", "二", "三",
                              "四", "五", "六"};
    printf("  星期%s\n", weekdays[local->tm_wday]);
    printf("  一年中的第 %d 天\n", local->tm_yday);
    printf("  夏令时: %s\n", local->tm_isdst ? "启用" : "未启用");

    // UTC 时间
    struct tm *utc = gmtime(&now);
    printf("\nUTC 时间:\n");
    printf("  %d年%02d月%02d日 %02d:%02d:%02d\n",
           utc->tm_year + 1900,
           utc->tm_mon + 1,
           utc->tm_mday,
           utc->tm_hour,
           utc->tm_min,
           utc->tm_sec);

    // ========== 3. strftime 格式化 ==========
    printf("\n===== strftime 格式化 =====\n");

    char buffer[100];

    // 常用格式
    strftime(buffer, sizeof(buffer),
             "%Y-%m-%d %H:%M:%S", local);
    printf("标准格式: %s\n", buffer);

    strftime(buffer, sizeof(buffer),
             "%Y年%m月%d日 %H时%M分%S秒", local);
    printf("中文格式: %s\n", buffer);

    strftime(buffer, sizeof(buffer),
             "%A, %B %d, %Y", local);
    printf("英文格式: %s\n", buffer);

    strftime(buffer, sizeof(buffer),
             "%I:%M %p", local);
    printf("12小时制: %s\n", buffer);

    strftime(buffer, sizeof(buffer),
             "%j (一年中的第%d天)", local);
    printf("年积日:   %s\n", buffer);

    // strftime 格式说明符：
    // %Y 4位年份  %y 2位年份  %m 月份(01-12)
    // %d 日期(01-31)  %H 小时(00-23)  %I 小时(01-12)
    // %M 分钟  %S 秒  %p AM/PM  %A 星期全名
    // %B 月份全名  %j 年积日  %W 年第几周
    // %u 星期几(1-7)  %z 时区

    // ========== 4. mktime — 构造时间 ==========
    printf("\n===== mktime 构造时间 =====\n");

    struct tm some_day = {0};
    some_day.tm_year = 2024 - 1900;  // 2024年
    some_day.tm_mon  = 0;            // 一月
    some_day.tm_mday = 1;            // 1号

    time_t timestamp = mktime(&some_day);
    printf("2024-01-01 的时间戳: %ld\n", (long)timestamp);
    printf("对应日期: %s", ctime(&timestamp));
    printf("星期几: 星期%s\n", weekdays[some_day.tm_wday]);
    // mktime 会修正 tm_wday 等字段

    // 计算某个月的天数
    int year = 2024, month = 2;  // 二月
    struct tm tm_start = {0};
    tm_start.tm_year = year - 1900;
    tm_start.tm_mon  = month - 1;
    tm_start.tm_mday = 1;
    mktime(&tm_start);  // 填充 tm_wday

    // 下个月的第一天减一天 = 本月最后一天
    if (month < 12) {
        tm_start.tm_mon++;
    } else {
        tm_start.tm_year++;
        tm_start.tm_mon = 0;
    }
    mktime(&tm_start);
    time_t next_month = mktime(&tm_start);
    struct tm tm_end = *localtime(&next_month);
    // 回到这个月  // 回退到本月
    // 简化：直接看最后一天
    int last_day = 0;
    if (month == 2) {
        // 判断闰年
        int is_leap = (year % 400 == 0 ||
                      (year % 4 == 0 && year % 100 != 0));
        last_day = is_leap ? 29 : 28;
    } else if (month == 4 || month == 6 ||
               month == 9 || month == 11) {
        last_day = 30;
    } else {
        last_day = 31;
    }
    printf("%d年%d月有 %d 天\n", year, month, last_day);

    // ========== 5. difftime — 时间差 ==========
    printf("\n===== difftime 时间差 =====\n");

    struct tm start_tm = {0};
    start_tm.tm_year = 2024 - 1900;
    start_tm.tm_mon  = 0;
    start_tm.tm_mday = 1;
    time_t start = mktime(&start_tm);

    time_t end = time(NULL);

    double seconds = difftime(end, start);
    printf("2024-01-01 到当前: %.0f 秒\n", seconds);
    printf("  = %.1f 分钟\n", seconds / 60);
    printf("  = %.1f 小时\n", seconds / 3600);
    printf("  = %.1f 天\n", seconds / 86400);

    // ========== 6. clock() — CPU 时间 ==========
    printf("\n===== CPU 时间 =====\n");

    clock_t start_cpu = clock();

    // 模拟一些计算
    volatile double sum = 0;
    for (long i = 0; i < 10000000; i++) {
        sum += 0.000001;
    }

    clock_t end_cpu = clock();
    double cpu_time = (double)(end_cpu - start_cpu) / CLOCKS_PER_SEC;

    printf("循环结果: %.2f\n", sum);
    printf("CPU 时间: %.4f 秒\n", cpu_time);

    // ========== 7. asctime — 从 struct tm 输出字符串 ==========
    printf("\n===== asctime =====\n");

    struct tm *t = localtime(&now);
    printf("asctime: %s", asctime(t));

    // ========== 8. 时间解析 ==========
    printf("\n===== 时间字符串解析 =====\n");
    // strptime 是 POSIX 函数（非标准 C）
    // 但 Windows 可能不支持，这里用 sscanf 代替

    const char *date_str = "2024-12-25 10:30:00";
    struct tm parsed = {0};
    sscanf(date_str, "%d-%d-%d %d:%d:%d",
           &parsed.tm_year, &parsed.tm_mon,
           &parsed.tm_mday, &parsed.tm_hour,
           &parsed.tm_min, &parsed.tm_sec);
    parsed.tm_year -= 1900;  // 减去1900
    parsed.tm_mon -= 1;      // 月份0开始

    time_t parsed_time = mktime(&parsed);
    printf("解析 \"%s\" → %s", date_str, ctime(&parsed_time));

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. time_t 存储时间戳（秒数）
 * 2. localtime 转本地时间，gmtime 转 UTC
 * 3. struct tm 中 tm_year 从1900算起，tm_mon 从0开始
 * 4. strftime 灵活格式化时间字符串
 * 5. mktime 将 struct tm 转为 time_t 并修正字段
 * 6. difftime 计算 time_t 差值（秒）
 * 7. clock() 测量 CPU 执行时间
 * ============================================
 */
