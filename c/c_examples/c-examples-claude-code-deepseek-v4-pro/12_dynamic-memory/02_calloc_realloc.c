/*
 * ============================================
 * 知识点：calloc 和 realloc
 * 说明：
 *   calloc() 和 realloc() 是动态内存分配的
 *   补充函数。
 *
 *   calloc(n, size) — 分配 n*size 字节并初始化为 0
 *   realloc(ptr, new_size) — 调整已分配内存的大小
 *
 * 编译方法：
 *   gcc 02_calloc_realloc.c -o 02_calloc_realloc
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <stdlib.h>
#include <string.h>

int main() {
    // ========== calloc ==========
    printf("===== calloc — 分配并清零 =====\n");

    int n = 10;

    // calloc 分配 n 个元素，每个元素 sizeof(int)，全部初始化为 0
    int *arr = (int*)calloc(n, sizeof(int));

    if (arr == NULL) {
        printf("分配失败！\n");
        return 1;
    }

    // calloc 自动将内存清零
    printf("calloc 分配的数组（自动清零）:\n");
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);  // 全部是 0
    }
    printf("\n\n");

    // malloc 不会清零
    int *arr2 = (int*)malloc(n * sizeof(int));
    printf("malloc 分配的数组（未初始化，可能是垃圾值）:\n");
    for (int i = 0; i < n; i++) {
        printf("%d ", arr2[i]);
    }
    printf("\n");

    free(arr2);

    // calloc vs malloc + memset
    // calloc(100, sizeof(int)) 等价于：
    // int *p = malloc(100 * sizeof(int));
    // memset(p, 0, 100 * sizeof(int));
    // 但 calloc 可能更高效（操作系统可以返回已清零的页面）

    // 使用 calloc 分配并初始化
    for (int i = 0; i < n; i++) {
        arr[i] = i * 10;
    }
    printf("\n赋值后: ");
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");

    // ========== realloc — 调整大小 ==========
    printf("\n===== realloc — 调整大小 =====\n");

    // 从 10 个元素扩展到 20 个
    int new_size = 20;
    int *expanded = (int*)realloc(arr, new_size * sizeof(int));

    if (expanded == NULL) {
        printf("realloc 失败！\n");
        free(arr);
        return 1;
    }

    // realloc 可能返回新的地址，也可能在原地址扩展
    arr = expanded;
    printf("扩展后的大小: %d 个元素\n", new_size);
    printf("原始数据保留: ");
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");
    printf("新元素（未初始化）: ");
    for (int i = n; i < new_size; i++) {
        printf("%d ", arr[i]);  // 新位置的值不确定
    }
    printf("\n\n");

    // 初始化新元素
    for (int i = n; i < new_size; i++) {
        arr[i] = i;
    }

    // 再缩小
    new_size = 5;
    int *shrunk = (int*)realloc(arr, new_size * sizeof(int));
    if (shrunk != NULL) {
        arr = shrunk;
        printf("缩小到 5 个元素:\n");
        for (int i = 0; i < 5; i++) {
            printf("%d ", arr[i]);
        }
        printf("\n");
    }

    free(arr);

    // ========== realloc 的特殊用途 ==========
    printf("\n===== realloc 的特殊用途 =====\n");

    // 如果 ptr 为 NULL，realloc 等价于 malloc
    int *ptr = NULL;
    ptr = (int*)realloc(NULL, 5 * sizeof(int));  // 等价于 malloc
    if (ptr != NULL) {
        printf("realloc(NULL, size) 等价于 malloc(size)\n");
        for (int i = 0; i < 5; i++) {
            ptr[i] = i + 1;
        }
        free(ptr);
    }

    // 如果 size 为 0，realloc 等价于 free
    // ptr = realloc(ptr, 0);  // 等价于 free(ptr)，返回 NULL
    // 但不建议这样使用，清晰起见直接用 free

    // ========== 二维数组的动态分配 ==========
    printf("\n===== 动态二维数组 =====\n");

    int rows = 3, cols = 4;

    // 方式1：一次分配所有元素
    int *matrix = (int*)malloc(rows * cols * sizeof(int));
    if (matrix != NULL) {
        // 使用 matrix[i * cols + j] 访问
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                matrix[i * cols + j] = i * cols + j + 1;
            }
        }

        printf("方式1（一维模拟二维）:\n");
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                printf("%3d ", matrix[i * cols + j]);
            }
            printf("\n");
        }
        free(matrix);
    }

    // 方式2：指针数组（每行独立分配）
    int **mat2 = (int**)malloc(rows * sizeof(int*));
    if (mat2 != NULL) {
        for (int i = 0; i < rows; i++) {
            mat2[i] = (int*)malloc(cols * sizeof(int));
            if (mat2[i] != NULL) {
                for (int j = 0; j < cols; j++) {
                    mat2[i][j] = (i + 1) * 10 + j;
                }
            }
        }

        printf("\n方式2（指针数组）:\n");
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                printf("%3d ", mat2[i][j]);
            }
            printf("\n");
        }

        // 释放：先释放每行，再释放行指针数组
        for (int i = 0; i < rows; i++) {
            free(mat2[i]);
        }
        free(mat2);
    }

    // ========== realloc 的实际应用 ==========
    printf("\n===== 实际应用：动态数组 =====\n");

    // 实现一个简单的动态数组（类似 C++ vector）
    typedef struct {
        int *data;
        int size;
        int capacity;
    } DynamicArray;

    // 初始化
    DynamicArray da;
    da.size = 0;
    da.capacity = 2;
    da.data = (int*)malloc(da.capacity * sizeof(int));

    if (da.data == NULL) return 1;

    // 添加元素
    printf("动态添加元素:\n");
    for (int i = 1; i <= 8; i++) {
        // 当 size 达到 capacity 时扩容
        if (da.size >= da.capacity) {
            da.capacity *= 2;
            da.data = (int*)realloc(da.data,
                                    da.capacity * sizeof(int));
            printf("  扩容到 %d\n", da.capacity);
        }
        da.data[da.size++] = i * 10;
        printf("  添加: %d\n", i * 10);
    }

    // 打印
    printf("最终数组: ");
    for (int i = 0; i < da.size; i++) {
        printf("%d ", da.data[i]);
    }
    printf("\n");
    printf("size = %d, capacity = %d\n", da.size, da.capacity);

    // 清理
    free(da.data);
    da.data = NULL;

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. calloc 分配并清零，malloc 不初始化
 * 2. realloc 调整大小，可能移动数据
 * 3. realloc(NULL, size) 等价于 malloc
 * 4. 二维数组可用一维模拟或指针数组
 * 5. 动态数组是 realloc 的典型应用
 * 6. 每次 realloc 后必须更新指针
 * ============================================
 */
