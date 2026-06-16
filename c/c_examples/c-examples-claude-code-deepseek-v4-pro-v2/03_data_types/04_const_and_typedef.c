/*
 * ============================================================
 *  知识点: const 限定符与 typedef 类型别名
 *
 *  本文件覆盖以下核心概念:
 *    1. const 变量的声明与使用
 *    2. const 指针（pointer to const）与指针常量（const pointer）
 *    3. typedef 创建类型别名
 *    4. 常见 typedef 模式
 *
 *  编译指令:
 *    gcc 04_const_and_typedef.c -o 04_const_and_typedef.exe -std=c11 -Wall
 *
 *  运行指令:
 *    ./04_const_and_typedef.exe
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>

/*
 * ============================================
 *  1. typedef —— 创建类型别名
 * ============================================
 *
 *  typedef 的语法:
 *    typedef 原类型 新别名;
 *
 *  作用: 为已有的类型创建一个新的名字（别名）。
 *  注意: typedef 不创建新的类型，只是别名。
 *
 *  使用 typedef 的好处:
 *    - 提高代码可读性
 *    - 简化复杂类型声明（如函数指针）
 *    - 方便跨平台移植（如 int32_t 在 32/64 位平台上都表示 4 字节整数）
 */

/* 为 unsigned int 创建别名 UINT32（32 位无符号整数） */
typedef unsigned int UINT32;

/* 为 unsigned char 创建别名 BYTE */
typedef unsigned char BYTE;

/* 为结构体创建别名（这里先简单演示，结构体会在后续章节详细讲解）*/
typedef unsigned char BOOL;
#define TRUE  1
#define FALSE 0

/* 为函数指针创建别名 */
typedef int (*Comparator)(int, int);

/*
 * ============================================
 *  2. const 限定符
 * ============================================
 *
 *  const 是"类型限定符"（type qualifier），表示变量是"只读"的。
 *  一旦 const 变量被初始化，就不能再修改它的值。
 *
 *  const 的几种不同用法:
 *    (a) const int x = 10;           —— x 是常量，不能修改
 *    (b) const int *p;               —— p 指向一个常量整数（指针可以变，指向的内容不能变）
 *    (c) int * const p = &x;         —— p 是常量指针（指针不能变，指向的内容可以变）
 *    (d) const int * const p = &x;   —— p 是常量指针，指向常量整数（都不能变）
 */

/* 使用 typedef 创建 const 相关的别名 */
typedef const int CINT;     /* 相当于 const int 的别名 */

/* ===== 函数声明 ===== */
/* 使用 typedef 定义的函数指针类型 */
int compare_int(int a, int b);

/* 一个接受函数指针参数的排序函数（演示 typedef 的用法）*/
void bubble_sort(int arr[], int n, Comparator comp);

int main(void)
{
    printf("========================================\n");
    printf("       const 与 typedef 详解\n");
    printf("========================================\n\n");

    /*
     * ============================================
     *  1. typedef 的基本用法
     * ============================================
     */
    printf("===== 1. typedef 的基本用法 =====\n");

    /* 使用 UINT32 别名声明变量，等价于 unsigned int */
    UINT32 count = 100;
    printf("UINT32 count = %u (typedef unsigned int)\n", count);

    /* 使用 BYTE 别名声明变量，等价于 unsigned char */
    BYTE flag = 0xAB;
    printf("BYTE flag = 0x%X (typedef unsigned char)\n", flag);

    /* 使用 BOOL 别名 */
    BOOL is_ready = TRUE;
    printf("BOOL is_ready = %d (TRUE)\n", is_ready);

    /* 使用 typedef 声明的 const 别名 */
    CINT max_value = 1000;
    printf("CINT max_value = %d (typedef const int)\n", max_value);
    /* max_value = 2000; */    /* 错误！const 变量不能修改 */

    /*
     * ============================================
     *  2. const 限定符的四种用法
     * ============================================
     */
    printf("\n===== 2. const 限定符的四种用法 =====\n");

    int x = 10;
    int y = 20;

    /* (a) const int —— const 变量 */
    const int READONLY = 100;
    /* READONLY = 200; */     /* 编译错误：不能修改 const 变量 */
    printf("(a) const int READONLY = %d (不可修改)\n", READONLY);

    /* (b) pointer to const —— 指向常量的指针 */
    const int *p_to_const = &x;     /* p_to_const 可以指向不同的地址 */
    /* *p_to_const = 30; */         /* 编译错误：不能通过 p_to_const 修改指向的值 */
    printf("(b) pointer to const: p_to_const 指向 x = %d", *p_to_const);
    p_to_const = &y;                /* 合法：指针本身可以改变指向 */
    printf(", 然后指向 y = %d (指针可改，内容不可改)\n", *p_to_const);

    /* (c) const pointer —— 常量指针 */
    int *const const_p = &x;        /* const_p 一直指向 x */
    *const_p = 50;                  /* 合法：可以修改指向的内容 */
    /* const_p = &y; */             /* 编译错误：不能修改指针本身 */
    printf("(c) const pointer: *const_p 被改为 %d (指针不可改，内容可改)\n", *const_p);

    /* (d) const pointer to const —— 双重 const */
    const int *const cc_p = &x;     /* 既是常量指针，又指向常量 */
    /* *cc_p = 60; */               /* 编译错误 */
    /* cc_p = &y; */                /* 编译错误 */
    printf("(d) const pointer to const: cc_p 指向 x = %d (二者都不可改)\n\n", *cc_p);

    /*
     * ============================================
     *  3. const 与函数参数
     * ============================================
     *
     *  const 常用于函数参数，表明函数不会修改参数指向的数据。
     */
    printf("===== 3. const 与函数参数 =====\n");

    int numbers[] = {5, 3, 8, 1, 9, 2, 7, 4, 6};
    int n = sizeof(numbers) / sizeof(numbers[0]);

    printf("排序前: ");
    for (int i = 0; i < n; i++)
    {
        printf("%d ", numbers[i]);
    }
    printf("\n");

    /* 使用 typedef 定义的 Comparator 类型作为参数 */
    bubble_sort(numbers, n, compare_int);

    printf("排序后: ");
    for (int i = 0; i < n; i++)
    {
        printf("%d ", numbers[i]);
    }
    printf("\n\n");

    /*
     * ============================================
     *  4. 常见 typedef 模式
     * ============================================
     */
    printf("===== 4. 常见 typedef 模式 =====\n");

    /*
     * (a) 固定宽度的整数类型（类似 <stdint.h> 中的 int32_t、uint64_t）
     *     在跨平台编程中非常有用
     */
    printf("(a) 固定宽度类型: UINT32 永远是 4 字节无符号整数 (sizeof=%zu)\n", sizeof(UINT32));
    printf("    BYTE 永远是 1 字节无符号整数 (sizeof=%zu)\n", sizeof(BYTE));

    /*
     * (b) 布尔类型（在 C99 之前没有 _Bool / stdbool.h 时常用）
     */
    printf("(b) BOOL 类型: TRUE=%d, FALSE=%d\n", TRUE, FALSE);

    /*
     * (c) 函数指针类型别名
     */
    printf("(c) Comparator 函数指针类型: int (*)(int, int)\n");

    /*
     * (d) 数组类型别名
     */
    typedef int IntArray10[10];     /* 定义一个有 10 个 int 的数组类型 */
    IntArray10 arr = {0,1,2,3,4,5,6,7,8,9};
    printf("(d) IntArray10 数组: arr[0]=%d, arr[9]=%d\n", arr[0], arr[9]);

    /*
     * (e) 指针类型别名（注意：通常不推荐隐藏指针，会降低可读性）
     */
    typedef char* String;
    String s1 = "Hello";            /* char* 类型 */
    String s2 = "World";
    printf("(e) String (char*): %s %s\n", s1, s2);

    return 0;
}

/*
 * 比较两个整数的函数
 * 用于演示函数指针 typedef
 */
int compare_int(int a, int b)
{
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

/*
 * 冒泡排序 —— 使用函数指针实现比较逻辑
 * 演示 typedef 定义的函数指针类型
 */
void bubble_sort(int arr[], int n, Comparator comp)
{
    for (int i = 0; i < n - 1; i++)
    {
        for (int j = 0; j < n - i - 1; j++)
        {
            /* 使用函数指针调用比较函数 */
            if (comp(arr[j], arr[j + 1]) > 0)
            {
                /* 交换两个元素 */
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}
