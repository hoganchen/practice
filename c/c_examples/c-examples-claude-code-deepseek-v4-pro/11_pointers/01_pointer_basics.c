/*
 * ============================================
 * 知识点：指针基础
 * 说明：
 *   指针是C语言的精华，也是难点。
 *   指针存储的是另一个变量的内存地址。
 *
 *   核心概念：
 *   - & 取地址运算符：获取变量的地址
 *   - * 解引用运算符：访问指针指向的值
 *   - 指针本身也有地址
 *
 *   声明：类型 *指针名;
 *   初始化：指针名 = &变量;
 *   访问：*指针名
 *
 * 编译方法：
 *   gcc 01_pointer_basics.c -o 01_pointer_basics
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"

int main() {
    // ========== 指针的基本概念 ==========
    printf("===== 指针的基本概念 =====\n");

    int x = 42;
    int *ptr = &x;  // ptr 存储 x 的地址

    printf("变量 x 的值: %d\n", x);
    printf("x 的地址 (&x): %p\n", (void*)&x);
    printf("指针 ptr 的值: %p\n", (void*)ptr);
    printf("指针 ptr 指向的值 (*ptr): %d\n", *ptr);
    printf("指针 ptr 的地址 (&ptr): %p\n", (void*)&ptr);

    // ========== 通过指针修改变量 ==========
    printf("\n===== 通过指针修改变量 =====\n");

    *ptr = 100;  // 通过指针修改 x 的值
    printf("通过 *ptr = 100 修改后:\n");
    printf("x = %d, *ptr = %d\n", x, *ptr);

    // ========== 不同类型的指针 ==========
    printf("\n===== 不同类型的指针 =====\n");

    int    i = 42;
    double d = 3.14;
    char   c = 'A';

    int    *ip = &i;
    double *dp = &d;
    char   *cp = &c;

    printf("int    指针: %p, 指向值: %d\n", (void*)ip, *ip);
    printf("double 指针: %p, 指向值: %f\n", (void*)dp, *dp);
    printf("char   指针: %p, 指向值: %c\n", (void*)cp, *cp);

    printf("\n不同指针的大小:\n");
    printf("sizeof(int*)    = %zu 字节\n", sizeof(int*));
    printf("sizeof(double*) = %zu 字节\n", sizeof(double*));
    printf("sizeof(char*)   = %zu 字节\n", sizeof(char*));
    // 所有指针在 64 位系统上都是 8 字节

    // ========== NULL 指针 ==========
    printf("\n===== NULL 指针 =====\n");

    int *null_ptr = NULL;  // 指向空（不指向任何有效地址）

    printf("NULL 指针的值: %p\n", (void*)null_ptr);

    // 解引用 NULL 指针会崩溃
    // printf("%d\n", *null_ptr);  // 危险！段错误

    // 使用前检查
    if (null_ptr == NULL) {
        printf("指针为空，安全处理\n");
    }

    // ========== void 指针 ==========
    printf("\n===== void 指针 =====\n");
    /*
     * void* 可以指向任何类型的数据。
     * 但不能直接解引用，需要先转换为具体类型。
     */

    void *vp = &i;     // 可以指向 int
    printf("void* 指向 int: %d\n", *(int*)vp);  // 先转换再解引用

    vp = &d;           // 也可以指向 double
    printf("void* 指向 double: %f\n", *(double*)vp);

    vp = &c;           // 也可以指向 char
    printf("void* 指向 char: %c\n", *(char*)vp);

    // ========== 指针的指针 ==========
    printf("\n===== 指针的指针 =====\n");

    int val = 10;
    int *p1 = &val;    // 一级指针
    int **p2 = &p1;    // 二级指针（指针的指针）
    int ***p3 = &p2;   // 三级指针

    printf("val = %d\n", val);
    printf("*p1  = %d\n", *p1);
    printf("**p2 = %d\n", **p2);
    printf("***p3 = %d\n", ***p3);

    // ========== 指针与 const ==========
    printf("\n===== const 与指针 =====\n");

    int a = 10, b = 20;

    // 1. 指向 const 数据的指针（数据不可改，指针可改）
    const int *p_const_data = &a;
    // *p_const_data = 30;  // 错误！数据是 const
    p_const_data = &b;         // 可以，指针本身不是 const

    // 2. const 指针（数据可改，指针不可改）
    int *const const_p = &a;
    *const_p = 30;             // 可以，数据不是 const
    // const_p = &b;           // 错误！指针是 const

    // 3. const 指针指向 const 数据（都不能改）
    const int *const both = &a;
    // *both = 30;             // 错误
    // both = &b;              // 错误

    printf("const 指针示例: *p_const_data = %d\n", *p_const_data);
    printf("const 指针: *const_p = %d\n", *const_p);

    // ========== 指针的运算 ==========
    printf("\n===== 指针加减运算 =====\n");

    int arr[] = {10, 20, 30, 40, 50};
    int *ptr2 = &arr[0];  // 指向第一个元素

    printf("数组: {10, 20, 30, 40, 50}\n");
    printf("ptr2 指向 arr[0], *ptr2 = %d\n", *ptr2);

    // 指针加法：移动到下一个元素
    ptr2 = ptr2 + 1;
    printf("ptr2 + 1, *ptr2 = %d (arr[1])\n", *ptr2);

    ptr2 = ptr2 + 2;
    printf("ptr2 + 2 (从arr[1]), *ptr2 = %d (arr[3])\n", *ptr2);

    ptr2--;
    printf("ptr2--, *ptr2 = %d (arr[2])\n", *ptr2);

    // 指针差值：两个指针之间相差的元素个数
    int *start = &arr[0];
    int *end   = &arr[4];
    printf("end - start = %td (元素个数差)\n", end - start);

    // ========== 指针与 sizeof ==========
    printf("\n===== 指针的 sizeof =====\n");

    int *ip2;
    double *dp2;
    char *cp2;

    printf("sizeof(int*)    = %zu\n", sizeof(ip2));
    printf("sizeof(double*) = %zu\n", sizeof(dp2));
    printf("sizeof(char*)   = %zu\n", sizeof(cp2));
    // 在 64 位系统上都是 8 字节

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. & 取地址，* 解引用
 * 2. 指针需要初始化，避免野指针
 * 3. NULL 指针解引用会崩溃，使用前检查
 * 4. void* 是通用指针，需转换后使用
 * 5. const 位置不同含义不同
 * 6. 指针加减以指向类型的大小为单位
 * ============================================
 */
