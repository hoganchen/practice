/*
 * 知识点：动态内存分配 (Dynamic Memory Allocation)
 *
 * 本程序演示 C 语言中堆内存的动态管理，包括：
 *   1. malloc()  - 分配指定字节数的内存
 *   2. calloc()  - 分配并自动清零
 *   3. realloc() - 调整已分配内存的大小
 *   4. free()    - 释放内存
 *   5. 分配后检查是否为 NULL
 *   6. 内存泄漏的意识
 *
 * 需要 <stdlib.h> 头文件
 *
 * 编译与运行：
 *   gcc 04_dynamic_memory.c -o 04_dynamic_memory.exe -std=c11 -Wall
 *   ./04_dynamic_memory.exe
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>  // malloc, calloc, realloc, free

int main(void)
{
    /* ========== 1. malloc() —— 分配内存（不初始化） ========== */

    /*
     * void *malloc(size_t size);
     *   - 分配 size 字节的连续内存空间
     *   - 返回指向这块内存的 void* 指针
     *   - 内存内容不确定（不初始化）！
     *   - 失败返回 NULL
     */
    printf("=== malloc() —— 分配内存 ===\n");

    int n = 5;
    int *arr = (int *)malloc(n * sizeof(int));  // 分配 5 个 int 的空间

    // 重要：检查分配是否成功
    if (arr == NULL) {
        printf("内存分配失败！\n");
        return 1;
    }

    // malloc 分配的内存不会自动初始化，内容是随机的（垃圾值）
    printf("malloc 分配的内存（未初始化，可能有垃圾值）：\n");
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wmaybe-uninitialized"
    for (int i = 0; i < n; i++) {
        printf("  arr[%d] = %d\n", i, arr[i]);
    }
#pragma GCC diagnostic pop
    printf("\n");

    // 手动初始化
    for (int i = 0; i < n; i++) {
        arr[i] = (i + 1) * 10;
    }

    printf("初始化后：\n");
    for (int i = 0; i < n; i++) {
        printf("  arr[%d] = %d\n", i, arr[i]);
    }
    printf("\n");


    /* ========== 2. calloc() —— 分配并清零 ========== */

    /*
     * void *calloc(size_t count, size_t size);
     *   - 分配 count 个元素，每个元素 size 字节
     *   - 自动将分配的内存全部初始化为 0
     *   - 失败返回 NULL
     */
    printf("=== calloc() —— 分配并清零 ===\n");

    int *zero_arr = (int *)calloc(5, sizeof(int));  // 分配 5 个 int 并清零

    if (zero_arr == NULL) {
        printf("内存分配失败！\n");
        return 1;
    }

    // calloc 分配的内存已自动清零
    printf("calloc 分配的内存（已自动清零）：\n");
    for (int i = 0; i < 5; i++) {
        printf("  zero_arr[%d] = %d\n", i, zero_arr[i]);
    }
    printf("\n");


    /* ========== 3. realloc() —— 重新调整内存大小 ========== */

    /*
     * void *realloc(void *ptr, size_t new_size);
     *   - 调整之前分配的内存块的大小
     *   - 可能移动内存块到新位置（返回新的指针）
     *   - 新增加部分的内容不确定
     *   - 如果 ptr 为 NULL，行为等同于 malloc(new_size)
     *   - 如果 new_size 为 0，行为等同于 free(ptr)
     *   - 失败返回 NULL，原来的内存块保持不变！
     */
    printf("=== realloc() —— 重新调整大小 ===\n");

    // 将 arr 从 5 个 int 扩展到 8 个 int
    int *temp = (int *)realloc(arr, 8 * sizeof(int));

    if (temp == NULL) {
        // realloc 失败，原内存仍然有效，需要手动释放
        printf("realloc 失败！\n");
        free(arr);  // 释放原内存
        free(zero_arr);
        return 1;
    }

    arr = temp;  // 更新指针指向新内存块
    printf("realloc 后数组大小从 5 扩展到 8：\n");

    // 初始化新增加的元素（位置 5~7）
    for (int i = 5; i < 8; i++) {
        arr[i] = (i + 1) * 10;
    }

    for (int i = 0; i < 8; i++) {
        printf("  arr[%d] = %d\n", i, arr[i]);
    }
    printf("\n");


    /* ========== 4. free() —— 释放内存 ========== */

    /*
     * void free(void *ptr);
     *   - 释放之前由 malloc/calloc/realloc 分配的内存
     *   - 释放后指针变成悬空指针（dangling pointer），不能再使用
     *   - 释放 NULL 是安全的（什么都不做）
     *   - 重复释放同一块内存是未定义行为！
     */
    printf("=== free() —— 释放内存 ===\n");

    // 释放后最好将指针置为 NULL，防止悬空指针
    free(arr);
    arr = NULL;  // 避免悬空指针

    free(zero_arr);
    zero_arr = NULL;

    printf("内存已释放，指针已置 NULL。\n\n");


    /* ========== 5. 动态分配数组的典型用法 ========== */

    printf("=== 动态分配数组的典型用法 ===\n");

    int count;
    printf("请输入数组大小：");
    scanf("%d", &count);

    // 根据用户输入动态分配数组（运行时确定大小）
    int *dynamic_arr = (int *)malloc(count * sizeof(int));
    if (dynamic_arr == NULL) {
        printf("内存分配失败！\n");
        return 1;
    }

    // 填充并打印
    for (int i = 0; i < count; i++) {
        dynamic_arr[i] = i * i;
    }
    printf("平方数数组：");
    for (int i = 0; i < count; i++) {
        printf("%d ", dynamic_arr[i]);
    }
    printf("\n\n");

    free(dynamic_arr);
    dynamic_arr = NULL;


    /* ========== 6. 常见错误（注释说明，不执行） ========== */

    /*
     * 错误 1：忘记释放内存（内存泄漏）
     *   int *leak = malloc(1000);
     *   // ... 使用 ...
     *   // 忘记 free(leak) ——> 程序退出前一直占用内存
     *
     * 错误 2：释放后继续使用（悬空指针 / use-after-free）
     *   free(ptr);
     *   *ptr = 42;  // 未定义行为！
     *
     * 错误 3：重复释放（double free）
     *   free(ptr);
     *   free(ptr);  // 未定义行为！
     *
     * 错误 4：内存越界
     *   int *p = malloc(5 * sizeof(int));
     *   p[5] = 100;  // 越界访问！
     */

    printf("=== 总结 ===\n");
    printf("malloc + free：手动管理内存\n");
    printf("calloc：分配 + 自动清零\n");
    printf("realloc：调整大小\n");
    printf("始终检查返回值是否为 NULL！\n");
    printf("释放后置 NULL，防止悬空指针！\n");

    return 0;
}
