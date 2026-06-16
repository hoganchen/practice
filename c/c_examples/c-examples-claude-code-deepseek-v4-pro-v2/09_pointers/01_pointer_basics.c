/*
 * 知识点：指针基础 (Pointer Basics)
 *
 * 本程序演示 C 语言中指针的基本概念，包括：
 *   1. 取地址运算符（&）
 *   2. 解引用运算符（*）
 *   3. 指针的声明语法
 *   4. 空指针（NULL 宏）
 *   5. 不同类型的指针
 *
 * 编译与运行：
 *   gcc 01_pointer_basics.c -o 01_pointer_basics.exe -std=c11 -Wall
 *   ./01_pointer_basics.exe
 */

#include "../common/charset.h"
#include <stdio.h>

int main(void)
{
    /* ========== 1. 指针声明与取地址（&） ========== */

    int num = 42;            // 普通整型变量
    int *p_num = &num;       // p_num 是一个指向 int 的指针，存储了 num 的地址

    /*
     * 声明解读：
     *   int *p_num;
     *   - int  ：指针指向的类型是 int
     *   - *    ：表示 p_num 是一个指针
     *   - p_num：指针变量的名称
     *
     * 可以读作："p_num 是一个指向 int 的指针"
     */

    printf("=== 取地址与解引用 ===\n");
    printf("num 的值：      %d\n", num);
    printf("num 的地址：    %p\n", (void *)&num);   // & 取地址运算符
    printf("p_num 的值：    %p\n", (void *)p_num);   // p_num 中存的就是 num 的地址
    printf("解引用 p_num：  %d\n\n", *p_num);        // * 解引用运算符：访问指针指向的值


    /* ========== 2. 解引用（*）修改值 ========== */

    // 通过指针修改变量的值
    *p_num = 100;  // 等价于 num = 100
    printf("=== 通过指针修改值 ===\n");
    printf("通过 *p_num = 100 修改后：\n");
    printf("num = %d\n", num);
    printf("*p_num = %d\n\n", *p_num);


    /* ========== 3. 不同类型指针 ========== */

    char ch = 'A';
    int  i  = 123;
    double d = 3.14159;

    char   *p_ch = &ch;    // 指向 char 的指针
    int    *p_i  = &i;     // 指向 int 的指针
    double *p_d  = &d;     // 指向 double 的指针

    /*
     * 不同类型的指针本质上都是"地址"（一个整数），但类型信息告诉编译器：
     *   - 解引用时读取多少个字节（char=1, int=4, double=8）
     *   - 指针加减时移动多少个字节（详见指针算术）
     */

    printf("=== 不同类型的指针 ===\n");
    printf("char  指针：p_ch = %p, *p_ch = %c\n", (void *)p_ch, *p_ch);
    printf("int   指针：p_i  = %p, *p_i  = %d\n", (void *)p_i, *p_i);
    printf("double指针：p_d  = %p, *p_d  = %.2f\n\n", (void *)p_d, *p_d);


    /* ========== 4. 空指针（NULL） ========== */

    int *null_ptr = NULL;  // NULL 是一个宏，在 <stdio.h>/<stddef.h> 中定义

    printf("=== 空指针 ===\n");
    printf("null_ptr = %p\n", (void *)null_ptr);

    // 解引用空指针是未定义行为！会导致程序崩溃（段错误）
    // 下面的代码会被注释掉，因为它会崩溃：
    // printf("*null_ptr = %d\n", *null_ptr);  // 崩溃！

    // 安全做法：在使用指针前检查是否为 NULL
    if (null_ptr == NULL) {
        printf("null_ptr 是空指针，不能解引用\n\n");
    }


    /* ========== 5. 指针的指针（简单示例） ========== */

    int  value = 10;
    int *ptr   = &value;    // 一级指针：指向 value
    int **pptr = &ptr;      // 二级指针：指向 ptr（指向 int 的指针）

    printf("=== 多级指针（简介） ===\n");
    printf("value  = %d\n", value);
    printf("*ptr   = %d\n", *ptr);
    printf("**pptr = %d\n\n", **pptr);


    /* ========== 6. 指针的大小 ========== */

    // 所有指针的大小在同一个平台上是一样的
    // 32 位系统：4 字节；64 位系统：8 字节
    printf("=== 指针大小 ===\n");
    printf("sizeof(int*)    = %zu 字节\n", sizeof(int *));
    printf("sizeof(char*)   = %zu 字节\n", sizeof(char *));
    printf("sizeof(double*) = %zu 字节\n", sizeof(double *));
    printf("sizeof(void*)   = %zu 字节\n\n", sizeof(void *));


    /* ========== 7. 完整示例：通过指针交换变量 ========== */

    int a = 10, b = 20;
    printf("=== 通过指针交换（swap） ===\n");
    printf("交换前：a = %d, b = %d\n", a, b);

    // 用指针交换 a 和 b 的值
    int temp = *p_i;  // 先让 p_i 指向 a
    // 实际上我们应该让 p_i 指向 a，但 p_i 目前还指向之前的 i
    // 重新来一次：
    int *pa = &a;
    int *pb = &b;
    temp = *pa;
    *pa  = *pb;
    *pb  = temp;

    printf("交换后：a = %d, b = %d\n", a, b);

    return 0;
}
