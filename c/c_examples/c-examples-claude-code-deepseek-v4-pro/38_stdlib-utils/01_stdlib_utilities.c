/*
 * ============================================
 * 知识点：标准库实用工具 <stdlib.h>
 * 说明：
 *   <stdlib.h> 提供了很多重要工具函数，
 *   除了内存管理（malloc/free）之外，还包括：
 *
 *   qsort()    — 快速排序
 *   bsearch()  — 二分查找
 *   atoi/atol/atof — 字符串→数字
 *   strtol/strtod  — 字符串→数字（带错误检测）
 *   rand/srand — 随机数（已在 33 中详述）
 *   system()   — 执行系统命令
 *   getenv()   — 获取环境变量
 *   abs/labs/llabs — 绝对值
 *   div/ldiv/lldiv — 整数除法（同时返回商和余数）
 *   abort/atexit/exit — 程序控制
 *
 * 编译方法：
 *   gcc 01_stdlib_utilities.c -o 01_stdlib_utilities
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <stdlib.h>   // 本文件的主角
#include <string.h>
#include <errno.h>
#include <limits.h>

// ========== 1. 字符串→数字转换 ==========
void string_to_number(void) {
    printf("--- 字符串 → 数字 ---\n");

    // atoi/atol/atof — 简单转换（无错误检测）
    printf("atoi(\"42\")      = %d\n", atoi("42"));
    printf("atol(\"1000000\") = %ld\n", atol("1000000"));
    printf("atof(\"3.14159\") = %f\n", atof("3.14159"));

    // strtol/strtoul/strtod — 带错误检测
    printf("\nstrtol 安全转换:\n");
    const char *str = "  123abc  ";
    char *endptr;

    errno = 0;
    long val = strtol(str, &endptr, 10);  // 10 进制

    if (errno == ERANGE) {
        printf("  溢出!\n");
    } else if (endptr == str) {
        printf("  无有效数字\n");
    } else {
        printf("  值: %ld\n", val);
        printf("  剩余字符串: \"%s\"\n", endptr);
    }

    // 自动检测进制
    printf("\n自动检测进制:\n");
    printf("  strtol(\"0xFF\")  = %ld (十六进制)\n",
           strtol("0xFF", NULL, 0));
    printf("  strtol(\"0777\")  = %ld (八进制)\n",
           strtol("0777", NULL, 0));
    printf("  strtol(\"42\")    = %ld (十进制)\n",
           strtol("42", NULL, 0));

    // 错误处理示例
    printf("\n错误处理:\n");
    errno = 0;
    long overflow = strtol("9999999999999999999999", NULL, 10);
    if (errno == ERANGE) {
        printf("  大数溢出: %ld (errno=ERANGE)\n", overflow);
        perror("  strtol");
    }
}

// ========== 2. qsort 排序 ==========
int compare_int(const void *a, const void *b) {
    // qsort 比较函数：返回负/0/正
    return (*(int*)a - *(int*)b);
}

int compare_int_desc(const void *a, const void *b) {
    return (*(int*)b - *(int*)a);
}

int compare_string(const void *a, const void *b) {
    // 字符串数组比较（注意：元素是 char*）
    return strcmp(*(const char**)a, *(const char**)b);
}

typedef struct {
    int id;
    char name[20];
    double score;
} Student;

int compare_student_by_score(const void *a, const void *b) {
    // 按成绩降序
    const Student *sa = (const Student*)a;
    const Student *sb = (const Student*)b;
    if (sa->score > sb->score) return -1;  // 降序
    if (sa->score < sb->score) return 1;
    return 0;
}

void qsort_demo(void) {
    printf("\n--- qsort 排序 ---\n");

    // 整数排序
    int numbers[] = {7, 2, 9, 1, 5, 3, 8, 4, 6};
    int n = sizeof(numbers) / sizeof(numbers[0]);

    qsort(numbers, n, sizeof(int), compare_int);
    printf("升序排列: ");
    for (int i = 0; i < n; i++) printf("%d ", numbers[i]);
    printf("\n");

    qsort(numbers, n, sizeof(int), compare_int_desc);
    printf("降序排列: ");
    for (int i = 0; i < n; i++) printf("%d ", numbers[i]);
    printf("\n");

    // 字符串排序
    char *fruits[] = {"banana", "apple", "date", "cherry", "elderberry"};
    int fn = sizeof(fruits) / sizeof(fruits[0]);

    qsort(fruits, fn, sizeof(char*), compare_string);
    printf("水果排序: ");
    for (int i = 0; i < fn; i++) printf("%s ", fruits[i]);
    printf("\n");

    // 结构体排序
    Student students[] = {
        {101, "Alice", 92.5},
        {102, "Bob", 85.0},
        {103, "Charlie", 95.5},
        {104, "David", 78.5}
    };
    int sn = sizeof(students) / sizeof(students[0]);

    qsort(students, sn, sizeof(Student), compare_student_by_score);
    printf("学生按成绩:\n");
    for (int i = 0; i < sn; i++) {
        printf("  %s: %.1f分\n", students[i].name, students[i].score);
    }
}

// ========== 3. bsearch 二分查找 ==========
void bsearch_demo(void) {
    printf("\n--- bsearch 二分查找 ---\n");

    // 必须已排序
    int sorted[] = {1, 3, 5, 7, 9, 11, 13, 15, 17, 19};
    int n = sizeof(sorted) / sizeof(sorted[0]);
    int key = 11;

    int *found = (int*)bsearch(&key, sorted, n, sizeof(int),
                               compare_int);
    if (found != NULL) {
        int idx = found - sorted;
        printf("找到 %d 在索引 %d\n", key, idx);
    } else {
        printf("未找到 %d\n", key);
    }

    // 查找不存在
    key = 8;
    found = (int*)bsearch(&key, sorted, n, sizeof(int),
                          compare_int);
    printf("查找 %d: %s\n", key, found ? "找到" : "未找到");
}

// ========== 4. system() 系统命令 ==========
void system_demo(void) {
    printf("\n--- system ---\n");

#ifdef _WIN32
    printf("执行: dir /B *.c (当前目录的 .c 文件)\n");
    int ret = system("dir /B *.c 2>nul");
#else
    printf("执行: ls -la *.c (当前目录的 .c 文件)\n");
    int ret = system("ls -la *.c 2>/dev/null");
#endif

    if (ret == -1) {
        printf("system() 调用失败\n");
    } else {
        printf("命令返回: %d\n", ret);
    }

    printf("\n注意: system() 有安全风险，尽量避免使用\n");
    printf("建议用 exec() 系列函数替代\n");
}

// ========== 5. getenv 环境变量 ==========
void getenv_demo(void) {
    printf("\n--- 环境变量 ---\n");

    const char *vars[] = {"PATH", "HOME", "USER", "TEMP", "SHELL"};
    int n = sizeof(vars) / sizeof(vars[0]);

    for (int i = 0; i < n; i++) {
        const char *value = getenv(vars[i]);
        if (value != NULL) {
            printf("  %s = %s\n", vars[i], value);
        } else {
            printf("  %s = (未设置)\n", vars[i]);
        }
    }
}

// ========== 6. abs / div ==========
void math_utils(void) {
    printf("\n--- abs / div ---\n");

    // 绝对值
    printf("abs(-10)    = %d\n", abs(-10));
    printf("labs(-100L) = %ld\n", labs(-100L));
    printf("llabs(-10000000000LL) = %lld\n",
           llabs(-10000000000LL));

    // div — 同时求商和余数
    div_t result = div(37, 5);
    printf("div(37, 5): 商=%d, 余=%d (37 = 5×%d + %d)\n",
           result.quot, result.rem,
           result.quot, result.rem);

    // ldiv — long 版本
    ldiv_t lresult = ldiv(1000000L, 333L);
    printf("ldiv(1000000, 333): 商=%ld, 余=%ld\n",
           lresult.quot, lresult.rem);
}

// ========== 7. atexit — 注册退出函数 ==========
void cleanup_func1(void) {
    printf("  atexit: 清理函数 1\n");
}

void cleanup_func2(void) {
    printf("  atexit: 清理函数 2\n");
}

void atexit_demo(void) {
    printf("\n--- atexit 注册退出处理 ---\n");

    // 注册程序退出时自动调用的函数（注册顺序与执行顺序相反）
    atexit(cleanup_func1);
    atexit(cleanup_func2);

    printf("  退出处理函数已注册\n");
    printf("  程序结束时自动调用（后进先出）\n");
}

// ========== 8. abort / exit ==========
void exit_control(void) {
    printf("\n--- exit / abort ---\n");
    printf("  exit(0) — 正常退出，调用 atexit 处理器\n");
    printf("  exit(1) — 异常退出\n");
    printf("  abort() — 立即终止，不调用 atexit\n");
    printf("  return  — 从 main 返回（相当于 exit）\n");
}

// ========== main ==========
int main(void) {
    printf("===== <stdlib.h> 实用工具 =====\n");

    string_to_number();
    qsort_demo();
    bsearch_demo();
    system_demo();
    getenv_demo();
    math_utils();
    atexit_demo();
    exit_control();

    printf("\n===== 总结 =====\n");
    printf("函数            | 用途\n");
    printf("---------------|-------------------------\n");
    printf("atoi/atol/atof | 简单字符串→数字转换\n");
    printf("strtol/strtod  | 安全字符串→数字转换\n");
    printf("qsort          | 通用排序（快排）\n");
    printf("bsearch        | 二分查找\n");
    printf("system         | 执行系统命令\n");
    printf("getenv         | 获取环境变量\n");
    printf("abs/labs/llabs | 整型绝对值\n");
    printf("div/ldiv       | 整数除法（商+余数）\n");
    printf("atexit         | 注册程序退出处理器\n");
    printf("exit/abort     | 程序终止\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. strtol 比 atoi 更安全（带错误检测）
 * 2. qsort 配合自定义比较函数，可排序任何类型
 * 3. bsearch 要求数组已排序
 * 4. system() 方便但有安全风险
 * 5. getenv 获取环境变量
 * 6. div 同时得到商和余数
 * 7. atexit 注册退出时的清理函数（后进先出）
 * ============================================
 */
