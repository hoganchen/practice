/*
 * 知识点：void 指针 —— 通用指针 (Void Pointers / Generic Pointers)
 *
 * 本程序演示 C 语言中 void* 指针的用法，包括：
 *   1. void* 可以指向任意类型的数据
 *   2. 解引用前必须先强制类型转换
 *   3. malloc 返回 void*
 *   4. 使用 void* 参数编写通用函数
 *
 * void* 的特点是：
 *   - 可以接收任何类型的指针（隐式转换）
 *   - 不能直接解引用（不知道类型大小）
 *   - 不能直接进行指针算术（不知道类型大小）
 *   - 需要转换回具体类型后才能使用
 *
 * 编译与运行：
 *   gcc 07_void_pointers.c -o 07_void_pointers.exe -std=c11 -Wall
 *   ./07_void_pointers.exe
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>

/*
 * 通用打印函数 —— 使用 void* 接受任意类型的数组
 * 通过函数指针 print_elem 来打印具体类型的元素
 * 这是 C 语言中实现"泛型"的一种常见方式
 */
void print_array(void *arr, int size, int elem_size,
                 void (*print_elem)(const void *))
{
    // void* 不能直接做指针算术，需要转为 char*（1 字节）
    // char* 指针加 N 移动 N 个字节，便于按字节定位元素
    char *byte_ptr = (char *)arr;

    printf("[");
    for (int i = 0; i < size; i++) {
        // 计算第 i 个元素的地址：base + i * elem_size
        void *elem_addr = byte_ptr + i * elem_size;
        print_elem(elem_addr);  // 调用具体类型的打印函数
        if (i < size - 1) {
            printf(", ");
        }
    }
    printf("]\n");
}

/*
 * 打印一个 int 元素的回调函数
 */
void print_int(const void *p)
{
    // 必须将 void* 转换为 int* 才能解引用
    const int *ip = (const int *)p;
    printf("%d", *ip);
}

/*
 * 打印一个 double 元素的回调函数
 */
void print_double(const void *p)
{
    const double *dp = (const double *)p;
    printf("%.1f", *dp);
}

/*
 * 打印一个 char 元素的回调函数
 */
void print_char(const void *p)
{
    const char *cp = (const char *)p;
    printf("'%c'", *cp);
}


int main(void)
{
    /* ========== 1. void* 可以指向任意类型 ========== */

    printf("=== void* 可以指向任意类型 ===\n");

    int    i_val = 42;
    double d_val = 3.14159;
    char   c_val = 'A';

    void *vp = NULL;  // 声明一个 void 指针

    // void* 可以接收任意类型的指针（隐式转换）
    vp = &i_val;
    printf("vp 指向 int：   ");
    // 解引用前必须先转换回具体类型
    printf("*(int *)vp = %d\n", *(int *)vp);

    vp = &d_val;
    printf("vp 指向 double：");
    printf("*(double *)vp = %.5f\n", *(double *)vp);

    vp = &c_val;
    printf("vp 指向 char：  ");
    printf("*(char *)vp = %c\n\n", *(char *)vp);


    /* ========== 2. void* 不能直接解引用 ========== */

    /*
     * 下面的代码会导致编译错误：
     *   vp = &i_val;
     *   printf("%d", *vp);    // 错误！不能解引用 void*
     *
     * 原因：编译器不知道 void* 指向的类型大小，无法确定读取多少字节
     */


    /* ========== 3. void* 不能直接做指针算术 ========== */

    /*
     * 下面的代码会导致编译错误：
     *   vp = &i_val;
     *   vp++;                  // 错误！void* 不知道步长
     *
     * 如果需要做指针算术，可以转为 char*（步长为 1 字节）
     * 或者转为具体类型的指针
     */

    int arr_int[] = { 10, 20, 30, 40, 50 };
    vp = arr_int;  // void* 指向数组

    // 使用 void* 遍历数组需要转为 char* 手动计算偏移
    printf("=== void* 不能直接做指针算术 ===\n");
    printf("通过 char* 偏移遍历：");
    for (int i = 0; i < 5; i++) {
        // 计算第 i 个元素的地址
        int *elem = (int *)((char *)vp + i * sizeof(int));
        printf("%d ", *elem);
    }
    printf("\n\n");


    /* ========== 4. malloc 返回 void* ========== */

    /*
     * malloc() 函数原型：
     *   void *malloc(size_t size);
     *
     * malloc 不知道调用者要什么类型，所以返回 void*
     * 调用者根据需要转换为具体类型
     */

    printf("=== malloc 返回 void* ===\n");

    // malloc 返回 void*，可以隐式或显式转换为任意指针类型
    int *dynamic = (int *)malloc(5 * sizeof(int));
    if (dynamic == NULL) {
        printf("分配失败！\n");
        return 1;
    }

    for (int i = 0; i < 5; i++) {
        dynamic[i] = (i + 1) * 10;
    }

    printf("动态分配的数组：");
    for (int i = 0; i < 5; i++) {
        printf("%d ", dynamic[i]);
    }
    printf("\n\n");

    free(dynamic);


    /* ========== 5. 使用 void* 编写通用函数 ========== */

    /*
     * qsort 和 bsearch 都是标准库中使用 void* 实现通用性的经典例子
     * 这里我们用自己的 print_array 函数来演示
     */

    printf("=== void* 通用函数 ===\n");

    int    int_arr[]    = { 1, 2, 3, 4, 5 };
    double double_arr[] = { 1.1, 2.2, 3.3, 4.4, 5.5 };
    char   char_arr[]   = { 'H', 'e', 'l', 'l', 'o' };

    // 同一个 print_array 函数可以处理任意类型的数组
    printf("int 数组：   ");
    print_array(int_arr, 5, sizeof(int), print_int);

    printf("double 数组：");
    print_array(double_arr, 5, sizeof(double), print_double);

    printf("char 数组：  ");
    print_array(char_arr, 5, sizeof(char), print_char);

    printf("\n");


    /* ========== 6. void* 与 NULL ========== */

    /*
     * NULL 在 C 中通常定义为 ((void*)0)
     * 或者 #define NULL ((void *)0)
     * 所以 NULL 就是一个 void* 类型的零值
     */
    void *null_check = NULL;
    printf("=== void* 与 NULL ===\n");
    printf("NULL 的值：%p\n", (void *)NULL);
    printf("null_check 是否为 NULL：%s\n\n", null_check == NULL ? "是" : "否");


    /* ========== 7. void* 的限制 ========== */

    /*
     * 1. 不能解引用 void*
     * 2. 不能做指针算术（GCC 扩展允许，但非标准）
     * 3. 不能声明 void 类型的变量（void v; 是错误的）
     * 4. 使用 void* 丢失了类型信息，需要使用者知道正确类型
     */
    printf("=== void* 的限制 ===\n");
    printf("1. 不能解引用 void*（必须先转换）\n");
    printf("2. 不能直接做指针算术\n");
    printf("3. 不能声明 void 类型的变量\n");
    printf("4. 丢失类型信息，需小心使用\n");

    return 0;
}
