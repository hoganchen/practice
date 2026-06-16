/*
 * 知识点：指向指针的指针 —— 二级指针 (Pointers to Pointers / Double Pointers)
 *
 * 本程序演示 C 语言中二级指针（指向指针的指针）的用法，包括：
 *   1. int **ptr 声明与理解
 *   2. 多级间接引用
 *   3. 常见用途：通过函数修改指针本身、模拟二维数组
 *
 * 声明解读：
 *   int **pp;
 *   从右向左读：pp 是指针，指向 int*（指向 int 的指针）
 *
 * 编译与运行：
 *   gcc 05_pointers_to_pointers.c -o 05_pointers_to_pointers.exe -std=c11 -Wall
 *   ./05_pointers_to_pointers.exe
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>

/*
 * 通过二级指针在函数中修改一级指针的值
 * 这个函数分配内存并让调用者的指针指向新分配的内存
 *
 * 参数 int **p_ptr：指向 int* 的指针
 *   - *p_ptr 是 int*，可以修改调用者的指针
 *   - **p_ptr 是 int，可以修改调用者指针指向的值
 */
int allocate_and_init(int **p_ptr, int size, int value)
{
    // 分配内存
    *p_ptr = (int *)malloc(size * sizeof(int));
    if (*p_ptr == NULL) {
        return -1;  // 分配失败
    }

    // 初始化每个元素
    for (int i = 0; i < size; i++) {
        (*p_ptr)[i] = value + i;
    }

    return 0;  // 成功
}

/*
 * 打印指针的值和地址（用于演示多级指针的关系）
 */
void show_ptr_chain(int value, int *ptr, int **pptr)
{
    printf("  value = %d\n", value);                       // 原始值
    printf("  &value = %p\n", (void *)&value);             // 值的地址
    printf("  ptr = %p\n", (void *)ptr);                   // ptr 中存储的地址
    printf("  *ptr = %d\n", *ptr);                         // 解引用 ptr
    printf("  &ptr = %p\n", (void *)&ptr);                 // ptr 自身的地址
    printf("  pptr = %p\n", (void *)pptr);                 // pptr 中存储的地址（即 &ptr）
    printf("  *pptr = %p\n", (void *)*pptr);               // pptr 解引用一次 = ptr
    printf("  **pptr = %d\n", **pptr);                     // pptr 解引用两次 = 值
}


int main(void)
{
    /* ========== 1. 二级指针基础 ========== */

    printf("=== 二级指针基础 ===\n");

    int  value = 42;       // 普通变量
    int *ptr   = &value;   // 一级指针：指向 value
    int **pptr = &ptr;     // 二级指针：指向 ptr

    // 展示多级指针的关系
    show_ptr_chain(value, ptr, pptr);
    printf("\n");

    /*
     * 关系图：
     *   pptr  ——>  ptr  ——>  value
     *   int**     int*      int
     *
     *   pptr == &ptr
     *  *pptr == ptr  == &value
     * **pptr == *ptr ==  value == 42
     */


    /* ========== 2. 通过二级指针修改一级指针 ========== */

    /*
     * 核心用途：当需要在函数内修改指针本身（而不仅仅是指向的值）时，
     * 必须传入指针的地址，即二级指针。
     *
     * 如果只传入一级指针，函数只能修改指针指向的值，
     * 不能修改指针本身（因为参数是复制的）。
     */

    printf("=== 通过二级指针在函数中修改指针 ===\n");

    int *dynamic_arr = NULL;  // 初始为空指针

    // 传入 &dynamic_arr（二级指针），函数将分配内存并修改 dynamic_arr
    int result = allocate_and_init(&dynamic_arr, 5, 100);

    if (result == 0) {
        printf("函数内分配并初始化成功：\n");
        for (int i = 0; i < 5; i++) {
            printf("  dynamic_arr[%d] = %d\n", i, dynamic_arr[i]);
        }
    } else {
        printf("分配失败！\n");
    }

    free(dynamic_arr);
    dynamic_arr = NULL;
    printf("\n");


    /* ========== 3. 模拟二维数组（指针数组方式） ========== */

    /*
     * 二级指针的一种常见用法：指针数组
     *   即数组的每个元素都是指针
     *   常用于字符串数组
     */
    printf("=== 指针数组（字符串数组） ===\n");

    // 字符串字面量数组，每个元素是 char*
    // fruits 的类型是 char*[]，在表达式中退化为 char**
    const char *fruits[] = { "苹果", "香蕉", "橙子", "葡萄", "西瓜" };

    int fruit_count = (int)(sizeof(fruits) / sizeof(fruits[0]));

    // 遍历字符串数组
    for (int i = 0; i < fruit_count; i++) {
        printf("  fruits[%d] = %s\n", i, fruits[i]);
        // fruits[i] 是 const char*，指向字符串字面量
    }
    printf("\n");


    /* ========== 4. 动态分配的二维"数组"（不规则的锯齿数组） ========== */

    /*
     * 使用二级指针动态创建一个"二维数组"：
     *   先分配一个指针数组（存放每行的指针）
     *   再为每行分配一维数组
     *   这种方式允许每行有不同的长度（锯齿数组 / jagged array）
     */
    printf("=== 动态分配锯齿数组（二级指针）===\n");

    int rows = 3;
    // 分配 rows 个 int* 指针
    int **jagged = (int **)malloc(rows * sizeof(int *));
    if (jagged == NULL) {
        printf("分配失败！\n");
        return 1;
    }

    // 每行分配不同数量的元素
    int cols_per_row[] = { 3, 5, 2 };

    for (int i = 0; i < rows; i++) {
        jagged[i] = (int *)malloc(cols_per_row[i] * sizeof(int));
        if (jagged[i] == NULL) {
            printf("第 %d 行分配失败！\n", i);
            // 需要清理已分配的内存...
            return 1;
        }

        // 初始化并打印
        printf("  第 %d 行（%d 个元素）：", i, cols_per_row[i]);
        for (int j = 0; j < cols_per_row[i]; j++) {
            jagged[i][j] = (i + 1) * 10 + j;  // 10, 11, 12 | 20, 21, ...
            printf("%d ", jagged[i][j]);
        }
        printf("\n");
    }

    // 释放内存（先释放每行，再释放指针数组）
    for (int i = 0; i < rows; i++) {
        free(jagged[i]);  // 释放第 i 行的元素
    }
    free(jagged);  // 释放指针数组
    jagged = NULL;
    printf("\n");


    /* ========== 5. 三级指针（极多级指针） ========== */

    /*
     * 理论上可以有任意多级指针，但实际中很少超过二级。
     * 三级指针 int ***p：指向 int** 的指针
     */
    printf("=== 三级指针（了解即可）===\n");

    int   v = 7;
    int  *p1 = &v;
    int **p2 = &p1;
    int ***p3 = &p2;

    printf("  v   = %d\n", v);
    printf("  *p1 = %d\n", *p1);
    printf("  **p2 = %d\n", **p2);
    printf("  ***p3 = %d\n", ***p3);

    return 0;
}
