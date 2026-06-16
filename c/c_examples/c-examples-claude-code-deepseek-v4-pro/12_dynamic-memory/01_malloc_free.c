/*
 * ============================================
 * 知识点：malloc 和 free — 堆内存分配
 * 说明：
 *   动态内存分配允许在运行时申请内存。
 *   分配的内存位于堆（heap）区，需要手动释放。
 *
 *   主要函数：
 *   malloc(size)     — 分配 size 字节
 *   calloc(n, size)  — 分配并初始化为 0
 *   realloc(ptr, size) — 重新分配大小
 *   free(ptr)        — 释放内存
 *
 *   注意事项：
 *   - 分配失败返回 NULL
 *   - 用完后必须 free，否则内存泄漏
 *   - free 后指针应置 NULL（悬空指针）
 *
 * 编译方法：
 *   gcc 01_malloc_free.c -o 01_malloc_free
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <stdlib.h>  // malloc, free, calloc, realloc

int main() {
    // ========== malloc 基础 ==========
    printf("===== malloc 基本用法 =====\n");

    // 分配一个 int 大小的内存
    int *p = (int*)malloc(sizeof(int));
    if (p == NULL) {
        printf("内存分配失败！\n");
        return 1;
    }

    // 使用分配的内存
    *p = 42;
    printf("动态分配的整数: %d\n", *p);
    printf("地址: %p\n", (void*)p);

    // 释放内存
    free(p);
    p = NULL;  // 防止悬空指针
    printf("内存已释放，指针已置空\n");

    // ========== 分配数组 ==========
    printf("\n===== 动态分配数组 =====\n");

    int n = 10;
    int *arr = (int*)malloc(n * sizeof(int));
    if (arr == NULL) {
        printf("数组分配失败！\n");
        return 1;
    }

    // 使用动态数组
    printf("动态数组 %d 个元素:\n", n);
    for (int i = 0; i < n; i++) {
        arr[i] = (i + 1) * 10;  // 10, 20, 30, ...
        printf("%d ", arr[i]);
    }
    printf("\n");

    // 释放数组
    free(arr);
    arr = NULL;

    // ========== 分配结构体 ==========
    printf("\n===== 动态分配结构体 =====\n");

    struct Point {
        int x;
        int y;
    };

    struct Point *pt = (struct Point*)malloc(sizeof(struct Point));
    if (pt == NULL) {
        printf("结构体分配失败！\n");
        return 1;
    }

    pt->x = 10;
    pt->y = 20;
    printf("点: (%d, %d)\n", pt->x, pt->y);

    free(pt);
    pt = NULL;

    // ========== 内存泄漏演示（理论说明）==========
    printf("\n===== 内存泄漏说明 =====\n");
    /*
     * 以下代码会导致内存泄漏（注释掉，仅理论说明）
     *
     * while (1) {
     *     int *leak = (int*)malloc(1024 * 1024);  // 每次分配 1MB
     *     // 没有 free(leak)！
     * }
     *
     * 内存泄漏的后果：
     * 1. 程序内存占用持续增长
     * 2. 最终系统内存耗尽
     * 3. 程序可能被操作系统终止
     *
     * 避免内存泄漏：
     * 1. 每次 malloc 对应一个 free
     * 2. 在函数返回前释放所有分配的内存
     * 3. 使用工具（Valgrind）检测泄漏
     */
    printf("每条 malloc 必须有对应的 free\n");
    printf("可用 Valgrind 检测内存泄漏\n");

    // ========== 悬空指针 ==========
    printf("\n===== 悬空指针 =========\n");
    /*
     * 悬空指针：指向已释放内存的指针。
     * 解引用悬空指针是未定义行为。
     */

    int *dangling = (int*)malloc(sizeof(int));
    *dangling = 100;
    printf("分配: %d\n", *dangling);

    free(dangling);
    // 此时 dangling 是悬空指针！
    // *dangling = 200;  // 危险！访问已释放的内存

    // 释放后置为 NULL 是良好习惯
    dangling = NULL;

    // ========== 动态扩容 ==========
    printf("\n===== 动态数组的扩容 =====\n");

    int capacity = 4;
    int *dynamic = (int*)malloc(capacity * sizeof(int));
    int count = 0;

    // 模拟不断添加元素
    for (int i = 1; i <= 10; i++) {
        // 当空间不足时扩容
        if (count >= capacity) {
            capacity *= 2;
            int *temp = (int*)realloc(dynamic, capacity * sizeof(int));
            if (temp == NULL) {
                printf("扩容失败！\n");
                free(dynamic);
                return 1;
            }
            dynamic = temp;
            printf("  扩容到 %d 个元素\n", capacity);
        }
        dynamic[count++] = i * 10;
    }

    printf("动态数组内容: ");
    for (int i = 0; i < count; i++) {
        printf("%d ", dynamic[i]);
    }
    printf("\n最终容量: %d, 元素数: %d\n", capacity, count);

    free(dynamic);
    dynamic = NULL;

    // ========== 常见错误 ==========
    printf("\n===== 常见错误 =====\n");

    // 错误1：忘记检查 NULL
    int *big = (int*)malloc(100 * sizeof(int));
    if (big != NULL) {  // 必须检查
        printf("内存分配成功\n");
        free(big);
    }

    // 错误2：忘记 sizeof
    // int *wrong = malloc(100);  // 分配了 100 字节，但需要 100*4 字节

    // 错误3：多次释放
    int *once = (int*)malloc(sizeof(int));
    free(once);
    // free(once);  // 危险！double free 是未定义行为
    once = NULL;  // 置 NULL 后再次 free 是安全的
    // free(NULL);  // 标准保证 free(NULL) 是安全的

    printf("注意: free(NULL) 是安全的\n");
    printf("释放后置 NULL 可以避免 double free\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. malloc/calloc/realloc 分配堆内存
 * 2. 每次分配后检查是否为 NULL
 * 3. 分配的内存必须用 free 释放
 * 4. free 后指针置 NULL，避免悬空指针
 * 5. 每条 malloc 对应一条 free
 * 6. 避免内存泄漏和重复释放
 * ============================================
 */
