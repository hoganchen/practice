/*
 * 知识点：排序和查找 (Sorting and Searching with qsort / bsearch)
 *
 * 编译指令：gcc 04_sorting_searching.c -o 04_sorting_searching.exe -std=c11 -Wall
 * 运行指令：./04_sorting_searching.exe
 *
 * 本文件演示 C 标准库中的排序和二分查找函数：
 *   - qsort()   —— 快速排序（C 标准库实现）
 *   - bsearch() —— 二分查找（需在已排序数组上使用）
 *
 * 核心概念：
 *   比较函数签名：int cmp(const void *a, const void *b)
 *     - 返回负数：a 排在 b 前面
 *     - 返回 0：a 和 b 相等
 *     - 返回正数：a 排在 b 后面
 *   使用 void* 指针需要先转换为实际类型再解引用
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

/* ===== 整数的比较函数 ===== */

/* 整数升序比较（从小到大） */
int compare_int_asc(const void *a, const void *b) {
    /* 将 void* 转换成 int*，然后解引用获取值 */
    int ia = *(const int *)a;
    int ib = *(const int *)b;

    /* 直接相减即可，返回负数/零/正数 */
    return ia - ib;
}

/* 整数降序比较（从大到小） */
int compare_int_desc(const void *a, const void *b) {
    int ia = *(const int *)a;
    int ib = *(const int *)b;
    return ib - ia;  /* 与升序相反 */
}

/* ===== 浮点数的比较函数 ===== */

int compare_double(const void *a, const void *b) {
    double da = *(const double *)a;
    double db = *(const double *)b;

    /* 浮点数比较不能简单相减，会有精度问题 */
    if (da < db) return -1;
    if (da > db) return  1;
    return 0;
}

/* ===== 字符串的比较函数 ===== */

int compare_string(const void *a, const void *b) {
    /* qsort 传入的是 char**（指向字符串指针的指针）
     * a 和 b 是指向数组元素的指针，每个元素是 char* */
    const char *sa = *(const char *const *)a;
    const char *sb = *(const char *const *)b;
    return strcmp(sa, sb);  /* strcmp 返回值符合要求 */
}

/* ===== 结构体的比较函数 ===== */

typedef struct {
    int id;
    char name[32];
    double score;
} Student;

/* 按 ID 升序比较 */
int compare_student_by_id(const void *a, const void *b) {
    const Student *sa = (const Student *)a;
    const Student *sb = (const Student *)b;
    return sa->id - sb->id;
}

/* 按分数降序比较 */
int compare_student_by_score_desc(const void *a, const void *b) {
    const Student *sa = (const Student *)a;
    const Student *sb = (const Student *)b;
    if (sa->score < sb->score) return  1;
    if (sa->score > sb->score) return -1;
    return 0;
}

/* 打印整数数组 */
void print_int_array(const int arr[], int n) {
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");
}

/* 打印学生数组 */
void print_students(const Student arr[], int n) {
    printf("%-6s %-12s %s\n", "ID", "姓名", "分数");
    printf("------ ------------ ------\n");
    for (int i = 0; i < n; i++) {
        printf("%-6d %-12s %.1f\n", arr[i].id, arr[i].name, arr[i].score);
    }
}

int main() {
    printf("============================================\n");
    printf("  排序和查找演示 (qsort / bsearch)\n");
    printf("============================================\n\n");

    /* ===== 1. 整数排序 ===== */
    printf("----- 1. 整数排序 -----\n");

    int arr[] = {42, 7, 15, 8, 99, 23, 1, 56, 34, 11};
    int n = sizeof(arr) / sizeof(arr[0]);

    printf("原始数组: ");
    print_int_array(arr, n);

    /* qsort(数组, 元素数量, 每个元素大小, 比较函数) */
    qsort(arr, n, sizeof(int), compare_int_asc);
    printf("升序排序: ");
    print_int_array(arr, n);

    qsort(arr, n, sizeof(int), compare_int_desc);
    printf("降序排序: ");
    print_int_array(arr, n);

    /* ===== 2. 浮点数排序 ===== */
    printf("\n----- 2. 浮点数排序 -----\n");

    double darr[] = {3.14, 1.41, 2.72, 0.58, 1.73, 2.24};
    int dn = sizeof(darr) / sizeof(darr[0]);

    printf("原始: ");
    for (int i = 0; i < dn; i++) printf("%.2f ", darr[i]);
    printf("\n");

    qsort(darr, dn, sizeof(double), compare_double);

    printf("排序: ");
    for (int i = 0; i < dn; i++) printf("%.2f ", darr[i]);
    printf("\n");

    /* ===== 3. 字符串排序 ===== */
    printf("\n----- 3. 字符串排序 -----\n");

    const char *names[] = {"Charlie", "Alice", "Bob", "Eve", "David"};
    int name_count = sizeof(names) / sizeof(names[0]);

    printf("原始: ");
    for (int i = 0; i < name_count; i++) printf("%s ", names[i]);
    printf("\n");

    qsort(names, name_count, sizeof(char *), compare_string);

    printf("排序: ");
    for (int i = 0; i < name_count; i++) printf("%s ", names[i]);
    printf("\n");

    /* ===== 4. 结构体排序 ===== */
    printf("\n----- 4. 结构体排序 -----\n");

    Student students[] = {
        {3, "张三", 85.5},
        {1, "李四", 92.0},
        {4, "王五", 78.5},
        {2, "赵六", 95.5},
        {5, "钱七", 88.0}
    };
    int student_count = sizeof(students) / sizeof(students[0]);

    printf("按 ID 排序:\n");
    qsort(students, student_count, sizeof(Student), compare_student_by_id);
    print_students(students, student_count);

    printf("\n按分数降序排序:\n");
    qsort(students, student_count, sizeof(Student), compare_student_by_score_desc);
    print_students(students, student_count);

    /* ===== 5. bsearch 二分查找 ===== */
    printf("\n----- 5. bsearch 二分查找 -----\n");

    /* bsearch 要求数组已排序 */
    int sorted[] = {10, 20, 30, 40, 50, 60, 70, 80, 90, 100};
    int sn = sizeof(sorted) / sizeof(sorted[0]);

    int target = 60;
    /* bsearch(键指针, 数组, 元素数量, 元素大小, 比较函数) */
    int *found = (int *)bsearch(&target, sorted, sn, sizeof(int), compare_int_asc);

    if (found != NULL) {
        printf("找到 %d，位置索引: %ld\n", target, (long)(found - sorted));
    } else {
        printf("未找到 %d\n", target);
    }

    /* 查找不存在的值 */
    target = 55;
    found = (int *)bsearch(&target, sorted, sn, sizeof(int), compare_int_asc);
    if (found != NULL) {
        printf("找到 %d，位置索引: %ld\n", target, (long)(found - sorted));
    } else {
        printf("未找到 %d\n", target);
    }

    /* ===== 6. bsearch 在结构体数组中查找 ===== */
    printf("\n----- 6. 结构体二分查找 -----\n");

    /* 按 ID 排序 */
    qsort(students, student_count, sizeof(Student), compare_student_by_id);

    Student key = {2, "", 0.0};  /* 只设置 ID 字段用于查找 */
    Student *result = (Student *)bsearch(&key, students, student_count,
                                          sizeof(Student), compare_student_by_id);
    if (result != NULL) {
        printf("找到 ID=%d 的学生: %s, 分数 %.1f\n",
               result->id, result->name, result->score);
    } else {
        printf("未找到 ID=%d 的学生\n", key.id);
    }

    printf("\n============================================\n");
    printf("  程序结束\n");
    printf("============================================\n");

    return 0;
}
