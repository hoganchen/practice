/*
 * 知识点：指针算术 (Pointer Arithmetic)
 *
 * 本程序演示 C 语言中指针算术运算，包括：
 *   1. ptr + N 和 ptr - N（指针加减整数）
 *   2. 自增自减（++ / --）
 *   3. 指针相减得到 ptrdiff_t
 *   4. 指针与数组下标的关系：arr[i] == *(arr + i)
 *
 * 理解指针算术的关键：
 *   指针加 N 实际上移动 N * sizeof(指向的类型) 个字节
 *   例如 int* 加 1 移动 4 个字节，char* 加 1 移动 1 个字节
 *
 * 编译与运行：
 *   gcc 02_pointer_arithmetic.c -o 02_pointer_arithmetic.exe -std=c11 -Wall
 *   ./02_pointer_arithmetic.exe
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stddef.h>  // 提供 ptrdiff_t 类型

int main(void)
{
    /* ========== 1. 指针加减整数：地址的移动 ========== */

    int arr[5] = { 10, 20, 30, 40, 50 };
    int *ptr = arr;  // ptr 指向数组第一个元素 arr[0]

    printf("=== 指针加减整数 ===\n");
    printf("int 类型大小 = %zu 字节\n\n", sizeof(int));

    printf("ptr     = %p, *ptr     = %d\n", (void *)ptr, *ptr);
    printf("ptr + 1 = %p, *(ptr+1) = %d\n", (void *)(ptr + 1), *(ptr + 1));
    printf("ptr + 2 = %p, *(ptr+2) = %d\n", (void *)(ptr + 2), *(ptr + 2));
    printf("ptr + 3 = %p, *(ptr+3) = %d\n", (void *)(ptr + 3), *(ptr + 3));
    printf("ptr + 4 = %p, *(ptr+4) = %d\n\n", (void *)(ptr + 4), *(ptr + 4));

    /*
     * 注意地址的差值：
     *   相邻元素地址相差 4 个字节（sizeof(int) = 4）
     *   而不是 1 个字节！
     */


    /* ========== 2. 不同类型指针的算术差异 ========== */

    char   str[] = "Hello";
    int    nums[] = { 1, 2, 3, 4 };
    double vals[] = { 1.1, 2.2, 3.3, 4.4 };

    char   *pc = str;
    int    *pi = nums;
    double *pd = vals;

    printf("=== 不同类型指针加法差异 ===\n");
    printf("char*  加 1：%p -> %p（相差 %td 字节）\n",
           (void *)pc, (void *)(pc + 1), (char *)(pc + 1) - (char *)pc);
    printf("int*   加 1：%p -> %p（相差 %td 字节）\n",
           (void *)pi, (void *)(pi + 1), (char *)(pi + 1) - (char *)pi);
    printf("double* 加 1：%p -> %p（相差 %td 字节）\n\n",
           (void *)pd, (void *)(pd + 1), (char *)(pd + 1) - (char *)pd);


    /* ========== 3. 指针自增自减（++ / --） ========== */

    printf("=== 指针自增自减 ===\n");
    ptr = arr;  // 重新指向数组开头
    printf("初始 ptr = %p, *ptr = %d\n", (void *)ptr, *ptr);

    ptr++;  // 移动指针到下一个元素
    printf("ptr++ 后 = %p, *ptr = %d\n", (void *)ptr, *ptr);

    ptr++;  // 再移动一次
    printf("ptr++ 后 = %p, *ptr = %d\n", (void *)ptr, *ptr);

    ptr--;  // 往回移动一个元素
    printf("ptr-- 后 = %p, *ptr = %d\n", (void *)ptr, *ptr);

    printf("\n");

    // 使用指针遍历数组（等效于下标访问）
    printf("用指针遍历数组：");
    ptr = arr;
    for (int i = 0; i < 5; i++) {
        printf("%d ", *ptr);  // 访问当前指向的元素
        ptr++;                // 移到下一个元素
    }
    printf("\n\n");


    /* ========== 4. arr[i] 与 *(arr + i) 等价 ========== */

    /*
     * 核心知识点：数组下标访问本质就是指针算术
     *   arr[i] 完全等价于 *(arr + i)
     *   同理 i[arr] 也等价于 *(i + arr)（但不要这样写，可读性差）
     */

    printf("=== arr[i] 与 *(arr + i) 等价 ===\n");

    // 方式一：下标访问
    printf("下标访问：\n");
    for (int i = 0; i < 5; i++) {
        printf("  arr[%d] = %d\n", i, arr[i]);
    }

    // 方式二：指针算术
    printf("指针算术 *(arr + i)：\n");
    for (int i = 0; i < 5; i++) {
        printf("  *(arr + %d) = %d\n", i, *(arr + i));
    }

    // 方式三：i[arr]（语法上等价，但不推荐！）
    printf("奇怪的 i[arr] 写法（不推荐）：\n");
    for (int i = 0; i < 5; i++) {
        printf("  %d[arr] = %d\n", i, i[arr]);  // 等价于 arr[i]
    }
    printf("\n");


    /* ========== 5. 指针相减：获得 ptrdiff_t ========== */

    /*
     * 两个同类型指针相减，得到它们之间的元素个数
     * 结果类型是 ptrdiff_t（在 <stddef.h> 中定义，通常是有符号整数）
     */
    int *start = &arr[0];
    int *end   = &arr[4];

    ptrdiff_t diff = end - start;  // 两个指针之间相差的元素个数

    printf("=== 指针相减 ===\n");
    printf("start = %p (arr[0])\n", (void *)start);
    printf("end   = %p (arr[4])\n", (void *)end);
    printf("end - start = %td（相差 %d 个元素）\n\n", diff, (int)diff);


    /* ========== 6. 安全注意事项 ========== */

    /*
     * 指针算术只能在同一数组（或超过末尾一个位置）内进行，否则是未定义行为。
     * 允许指向数组的最后一个元素之后一个位置（one-past-the-end），
     * 但不能解引用那个位置。
     */
    printf("=== 安全边界 ===\n");
    ptr = arr + 5;  // 指向数组末尾之后的一个位置（允许存在，但不可解引用）
    printf("arr + 5 = %p（数组末尾之后，可以存在但不能解引用）\n", (void *)ptr);

    // 下面的代码是未定义行为（指针超出有效范围太多）：
    // ptr = arr + 1000;  // 危险！不能保证安全
    // *ptr = 999;        // 可能崩溃

    return 0;
}
