/*
 * 知识点：const 与指针的三种组合 (Const and Pointers)
 *
 * 本程序演示 const 与指针结合时容易混淆的三种情况，包括：
 *   1. const int *p  —— 指向 const int 的指针（指针可变，所指内容不可变）
 *   2. int *const p  —— 指向 int 的 const 指针（指针不可变，所指内容可变）
 *   3. const int *const p —— const 指针指向 const int（两者都不可变）
 *
 * 终极技巧：从右向左读法则！
 *   以 const int *const p 为例：
 *     p is a const pointer to const int
 *     （p 是一个常量指针，指向一个常量整数）
 *
 * 编译与运行：
 *   gcc 06_const_pointers.c -o 06_const_pointers.exe -std=c11 -Wall
 *   ./06_const_pointers.exe
 */

#include "../common/charset.h"
#include <stdio.h>

int main(void)
{
    /* ========== 预备变量 ========== */

    int a = 10;
    int b = 20;


    /* ========== 1. const int *p —— 指向常量的指针 ========== */

    /*
     * const int *p;
     * 从右向左读：p is a pointer to const int
     *   - p 本身可以修改（可以指向别的地址）
     *   - 但 *p 的值不可修改（不能通过 p 修改指向的内容）
     *
     * 等价写法：int const *p（语法上等价）
     */
    printf("=== 1. const int *p（指向常量的指针）===\n");

    const int *p1;       // p1 是指向 const int 的指针
    p1 = &a;             // OK：p1 可以指向 a
    printf("  p1 指向 a，*p1 = %d\n", *p1);

    // *p1 = 100;        // 错误！不能通过 p1 修改 a 的值（编译错误）

    p1 = &b;             // OK：p1 本身可以改变指向
    printf("  p1 改为指向 b，*p1 = %d\n", *p1);

    // 但 a 和 b 本身是否可修改不受指针影响
    a = 100;             // OK：a 本身不是 const
    printf("  直接修改 a = %d，p1 仍指向 b，*p1 = %d\n\n", a, *p1);


    /* ========== 2. int *const p —— 常量指针 ========== */

    /*
     * int *const p;
     * 从右向左读：p is a const pointer to int
     *   - p 本身不可修改（必须初始化，且不能指向别处）
     *   - 但 *p 的值可以修改（可以通过 p 修改指向的内容）
     */
    printf("=== 2. int *const p（常量指针）===\n");

    int *const p2 = &a;  // 初始化时必须赋值，之后不能再改变指向

    printf("  p2 指向 a，*p2 = %d\n", *p2);
    *p2 = 50;            // OK：可以通过 p2 修改 a 的值
    printf("  通过 *p2 = 50 修改后，a = %d\n", a);

    // p2 = &b;          // 错误！p2 是 const，不能改变指向（编译错误）
    printf("\n");


    /* ========== 3. const int *const p —— 常量指针指向常量 ========== */

    /*
     * const int *const p;
     * 从右向左读：p is a const pointer to const int
     *   - p 本身不可修改（必须初始化，不能指向别处）
     *   - *p 的值也不可修改（不能通过 p 修改指向的内容）
     *
     * 等价写法：int const *const p
     */
    printf("=== 3. const int *const p（常量指针指向常量）===\n");

    const int *const p3 = &a;  // 必须在初始化时赋值

    printf("  p3 指向 a，*p3 = %d\n", *p3);
    // *p3 = 200;           // 错误！不能通过 p3 修改值（编译错误）
    // p3 = &b;             // 错误！p3 本身不能改变指向（编译错误）

    // 但 a 本身仍然可以修改
    a = 300;
    printf("  直接修改 a = %d，*p3 现在读到的是 %d\n\n", a, *p3);


    /* ========== 4. const 和指针参数的用途 ========== */

    /*
     * 在函数参数中使用 const int* 是 C 语言中常见的做法：
     *   告诉调用者"这个函数不会修改你传入的数据"
     *   同时允许传入 const 和非 const 的实参
     */

    printf("=== 4. const 指针在函数参数中的用途 ===\n");

    const int data[] = { 1, 2, 3, 4, 5 };
    // 常见的"只读"参数声明
    // 使用 const int * 表明函数不会修改数组内容
    void print_data(const int *arr, int size);

    print_data(data, 5);
    printf("\n");


    /* ========== 5. 四种组合总结表 ========== */

    printf("=== 5. 四种组合总结 ===\n");
    printf("  声明                            指向可变？  值可变？\n");
    printf("  ───────────────────────────────  ──────     ──────\n");
    printf("  int *p                           YES        YES\n");
    printf("  const int *p   (int const *p)    YES        NO\n");
    printf("  int *const p                      NO        YES\n");
    printf("  const int *const p                 NO        NO\n\n");

    /*
     * 快速记忆法：
     *   const 在 * 左边：指向的内容是常量（不能通过指针改值）
     *   const 在 * 右边：指针本身是常量（不能改指向）
     *   const 在两边：都是常量
     */

    return 0;
}

/*
 * 一个使用 const int* 参数的函数
 * 这个函数保证不会修改数组中的元素
 */
void print_data(const int *arr, int size)
{
    printf("  数组内容：");
    for (int i = 0; i < size; i++) {
        printf("%d ", arr[i]);
        // arr[i] = 0;  // 编译错误！不能通过 const 指针修改
    }
    printf("\n");
}
