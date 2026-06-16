/*
 * 知识点：指针与数组的关系 (Pointers and Arrays)
 *
 * 本程序演示 C 语言中指针和数组之间的紧密关系，包括：
 *   1. 数组名是指向首元素的指针常量
 *   2. 数组下标与指针算术的等价性
 *   3. 数组作为函数参数时退化为指针
 *   4. sizeof 对数组和指针的不同结果
 *
 * 核心概念：
 *   在大多数表达式中，数组名会被隐式转换为指向其首元素的指针。
 *   但作为 sizeof 的操作数时，数组名不转换，返回整个数组的大小。
 *
 * 编译与运行：
 *   gcc 03_pointers_and_arrays.c -o 03_pointers_and_arrays.exe -std=c11 -Wall
 *   ./03_pointers_and_arrays.exe
 */

#include "../common/charset.h"
#include <stdio.h>

/*
 * 函数参数中的数组 —— 实际上退化为指针！
 * void func(int arr[]) 和 void func(int *arr) 完全等价
 *
 * 编译器会将数组形式的参数视为指针，所以 sizeof(arr) 在这里
 * 返回的是指针的大小，而不是数组的大小！
 */
void print_array(int arr[], int size)
{
    /*
     * 注意：这里 sizeof(arr) 是指针的大小（8 字节），
     * 不是数组的大小！因为 arr 已经退化为指针了。
     * 所以必须通过参数传入数组大小。
     */
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wsizeof-array-argument"
    printf("  在函数内 sizeof(arr) = %zu（指针大小，不是数组大小！）\n", sizeof(arr));
#pragma GCC diagnostic pop

    for (int i = 0; i < size; i++) {
        printf("%d ", arr[i]);  // 这里 arr[i] 等价于 *(arr + i)
    }
    printf("\n");
}

/*
 * 使用指针参数的等价写法（完全等价于上面的版本）
 */
void print_array_ptr(int *arr, int size)
{
    for (int i = 0; i < size; i++) {
        printf("%d ", *(arr + i));
    }
    printf("\n");
}

/*
 * 演示如何在函数中通过指针修改数组元素
 */
void double_elements(int *arr, int size)
{
    for (int i = 0; i < size; i++) {
        arr[i] *= 2;  // 等价于 *(arr + i) *= 2
    }
}


int main(void)
{
    /* ========== 1. 数组名是指向首元素的指针常量 ========== */

    int arr[5] = { 10, 20, 30, 40, 50 };

    printf("=== 数组名是指向首元素的指针 ===\n");
    printf("arr      = %p\n", (void *)arr);      // 数组名，即首元素地址
    printf("&arr[0]  = %p\n", (void *)&arr[0]);  // 显式取首元素地址
    printf("两者相等，说明 arr == &arr[0]\n\n");

    /*
     * 重要区别：
     *   arr  的类型是 int[5]（数组类型）
     *   &arr 的类型是 int(*)[5]（指向整个数组的指针）
     *   arr + 1 移动 sizeof(int) = 4 字节
     *   &arr + 1 移动 sizeof(int[5]) = 20 字节
     */
    printf("arr + 1  = %p（移动 %zu 字节，指向下一个 int）\n",
           (void *)(arr + 1), sizeof(int));
    printf("&arr + 1 = %p（移动 %zu 字节，跳过整个数组）\n",
           (void *)(&arr + 1), sizeof(arr));


    /* ========== 2. 数组下标与指针算术的等价性 ========== */

    printf("\n=== arr[i] == *(arr + i) ===\n");
    for (int i = 0; i < 5; i++) {
        printf("  arr[%d] = %d, *(arr + %d) = %d, %d[arr] = %d\n",
               i, arr[i], i, *(arr + i), i, i[arr]);
    }
    printf("\n");


    /* ========== 3. 使用指针遍历数组 ========== */

    printf("=== 使用指针遍历数组 ===\n");
    int *p = arr;  // p 指向数组首元素
    int *end = arr + 5;  // 指向数组末尾之后（作为哨兵）

    while (p < end) {
        printf("%d ", *p);
        p++;
    }
    printf("\n\n");


    /* ========== 4. 数组作为函数参数退化为指针 ========== */

    printf("=== 数组传参退化为指针 ===\n");
    int local_size = (int)(sizeof(arr) / sizeof(arr[0]));

    printf("  在 main 中 sizeof(arr) = %zu（整个数组的大小）\n", sizeof(arr));
    printf("  数组元素个数 = %d\n\n", local_size);

    printf("调用 print_array(arr, size)：\n");
    print_array(arr, local_size);
    printf("\n");

    printf("调用 print_array_ptr(arr, size)：\n");
    print_array_ptr(arr, local_size);
    printf("\n");


    /* ========== 5. 函数内通过指针修改数组 ========== */

    printf("=== 通过指针参数修改数组 ===\n");
    printf("原数组：");
    print_array(arr, local_size);

    double_elements(arr, local_size);  // 将每个元素乘以 2

    printf("翻倍后：");
    print_array(arr, local_size);
    printf("\n");


    /* ========== 6. sizeof 在数组和指针上的区别 ========== */

    /*
     * 这是一个常见的陷阱：
     *   sizeof(数组名)   = 整个数组占用的字节数
     *   sizeof(指针)     = 指针变量本身的大小（8 字节在 64 位系统）
     *
     * 当数组传给函数后，sizeof 在函数内对参数求值得到的是指针大小！
     * 这就是为什么传数组时必须同时传大小。
     */
    printf("=== sizeof 数组 vs 指针 ===\n");

    int arr2[10] = {0};
    int *ptr2 = arr2;  // ptr2 指向 arr2 的首元素

    printf("sizeof(arr2)  = %zu（整个数组，10 * 4 = 40 字节）\n", sizeof(arr2));
    printf("sizeof(ptr2)  = %zu（指针本身的大小，64位系统上 8 字节）\n", sizeof(ptr2));
    printf("\n");


    /* ========== 7. &arr 与 arr 的区别总结 ========== */

    printf("=== &arr 与 arr 的区别 ===\n");
    int matrix[3][4] = {0};

    printf("matrix       = %p（首行首元素的地址）\n", (void *)matrix);
    printf("matrix + 1   = %p（跳过一行，即 4 个 int）\n", (void *)(matrix + 1));
    printf("&matrix      = %p（整个 2D 数组的地址）\n", (void *)&matrix);
    printf("&matrix + 1  = %p（跳过整个 3x4 数组）\n", (void *)(&matrix + 1));

    return 0;
}
