/**
 * ============================================================================
 * 知识要点: 柔性数组成员 (Flexible Array Member) — C99 引入
 * ============================================================================
 *
 * 编译指令: gcc 05_flexible_array_member.c -o 05_flexible_array_member.exe -std=c11 -Wall
 * 运行指令: ./05_flexible_array_member.exe
 *
 * 知识点概述:
 *   柔性数组成员是结构体的最后一个成员，声明为 type arr[]; (不指定大小)。
 *   需要在运行时通过 malloc 手动分配内存: sizeof(struct) + count * sizeof(element)。
 *   与使用指针成员相比，柔性数组减少了内存分配次数，提升了缓存局部性。
 *
 * 限制:
 *   - 每个结构体只能有一个柔性数组成员
 *   - 必须是结构体的最后一个成员
 *   - 不能是 union 的一部分
 *   - 不能出现在位域结构中
 *   - 不能作为普通结构体变量声明（只能通过指针动态分配）
 * ============================================================================
 */

#include "../common/charset.h"
#include <stdio.h>   /* printf */
#include <stdlib.h>  /* malloc, free */
#include <string.h>  /* memset */

/* ============================================================================
 * 示例 1: 基础柔性数组 — 存储一组 int 值
 *
 * 对比传统做法:
 *   传统: 用指针成员 + 单独分配数据区（2次 malloc，容易内存泄漏）
 *   柔性: 一次 malloc 搞定（1次 malloc，内存连续，缓存友好）
 * ============================================================================
 */

/* 使用柔性数组成员的结构体 */
typedef struct {
    int length;      /* 数组元素个数 */
    int values[];    /* 柔性数组成员 — 不占 sizeof，必须在最后 */
} IntArray;

/* 使用指针成员的传统结构体（用于对比） */
typedef struct {
    int length;
    int *values;     /* 指针 — 需要额外分配内存 */
} IntArrayPtr;

/* ============================================================================
 * 示例 2: 字符串柔性数组 — 每个元素是字符串
 * ============================================================================
 */
typedef struct {
    int count;
    char *strings[];  /* 柔性数组，每个元素是指向字符串的指针 */
} StringArray;

/* ============================================================================
 * 辅助函数: 创建并初始化 IntArray
 * 参数: length — 要存储的元素个数
 * 返回: 指向已初始化的 IntArray 的指针，失败返回 NULL
 * ============================================================================
 */
IntArray* int_array_create(int length)
{
    /*
     * 核心分配逻辑:
     *   sizeof(IntArray)         — 结构体固定部分（只有 length）
     *   + length * sizeof(int)   — 柔性数组部分
     *
     * 柔性数组成员不占用 sizeof(IntArray) 的空间，分配时必须手动加上。
     */
    IntArray *arr = (IntArray*)malloc(sizeof(IntArray) + (size_t)length * sizeof(int));
    if (arr == NULL) {
        return NULL;  /* 内存分配失败 */
    }

    arr->length = length;

    /* 初始化所有元素为 0 */
    for (int i = 0; i < length; i++) {
        arr->values[i] = 0;
    }

    return arr;
}

/* ============================================================================
 * 辅助函数: 打印 IntArray 的内容
 * ============================================================================
 */
void int_array_print(const IntArray *arr)
{
    printf("IntArray (length=%d): [", arr->length);
    for (int i = 0; i < arr->length; i++) {
        printf("%d", arr->values[i]);
        if (i < arr->length - 1) {
            printf(", ");
        }
    }
    printf("]\n");
}

/* ============================================================================
 * 辅助函数: 释放 IntArray
 * 注意: 只需要一次 free，因为整个结构体是一次 malloc 分配的
 * ============================================================================
 */
void int_array_destroy(IntArray *arr)
{
    free(arr);
    /* arr 指针现在悬空，调用者应将其置为 NULL */
}

/* ============================================================================
 * 辅助函数: 创建并初始化 StringArray
 * 每个字符串指针单独分配，但结构体和指针数组是一次分配的
 * ============================================================================
 */
StringArray* string_array_create(int count, const char *default_value)
{
    /*
     * 分配结构体固定部分 + count 个 char* 指针的空间
     */
    StringArray *arr = (StringArray*)malloc(
        sizeof(StringArray) + (size_t)count * sizeof(char*)
    );
    if (arr == NULL) {
        return NULL;
    }

    arr->count = count;

    /* 为每个字符串指针单独分配内存 */
    for (int i = 0; i < count; i++) {
        size_t len = strlen(default_value);
        arr->strings[i] = (char*)malloc(len + 1);
        if (arr->strings[i] != NULL) {
            strcpy(arr->strings[i], default_value);
        }
    }

    return arr;
}

/* ============================================================================
 * 辅助函数: 打印 StringArray
 * ============================================================================
 */
void string_array_print(const StringArray *arr)
{
    printf("StringArray (count=%d): [", arr->count);
    for (int i = 0; i < arr->count; i++) {
        printf("\"%s\"", arr->strings[i]);
        if (i < arr->count - 1) {
            printf(", ");
        }
    }
    printf("]\n");
}

/* ============================================================================
 * 辅助函数: 释放 StringArray
 * 需要先释放每个字符串，再释放结构体
 * ============================================================================
 */
void string_array_destroy(StringArray *arr)
{
    if (arr == NULL) return;

    /* 先释放每个单独分配的字符串 */
    for (int i = 0; i < arr->count; i++) {
        free(arr->strings[i]);
    }

    /* 再释放结构体整体 */
    free(arr);
}

/* ============================================================================
 * 补充: 使用 sizeof 计算包含柔性数组的结构体
 *
 *   sizeof(IntArray) 只包含固定成员 length 的大小
 *   sizeof(IntArrayPtr) 包含指针 values 的大小
 *
 * 关键区别: 柔性数组成员本身不占用空间，而指针成员占用一个指针的空间
 * ============================================================================
 */
void demonstrate_sizeof(void)
{
    printf("\n====== sizeof 对比 ======\n");
    printf("sizeof(IntArray)     = %zu  (只有 length 成员，柔性数组不计入)\n",
           sizeof(IntArray));
    printf("sizeof(IntArrayPtr)  = %zu  (length + 指针 values)\n",
           sizeof(IntArrayPtr));
    printf("sizeof(int)          = %zu\n", sizeof(int));
    printf("sizeof(int*)         = %zu\n", sizeof(int*));
}

/* ============================================================================
 * 主函数: 演示柔性数组的完整使用流程
 * ============================================================================
 */
int main(void)
{
    printf("============================================\n");
    printf("  柔性数组成员 (Flexible Array Member) 示例\n");
    printf("============================================\n");

    /* ----------------------------------------------------------------
     * 示例 1: 创建长度为 5 的 IntArray
     * ---------------------------------------------------------------- */
    printf("\n====== 示例 1: 基本 IntArray ======\n");

    IntArray *arr = int_array_create(5);
    if (arr == NULL) {
        fprintf(stderr, "内存分配失败!\n");
        return 1;
    }

    /* 设置一些值 */
    for (int i = 0; i < arr->length; i++) {
        arr->values[i] = (i + 1) * 10;
    }

    int_array_print(arr);

    /* 修改再打印 */
    arr->values[2] = 999;
    printf("修改 values[2] = 999 后: ");
    int_array_print(arr);

    int_array_destroy(arr);
    arr = NULL;

    /* ----------------------------------------------------------------
     * 示例 2: 创建不同大小的数组
     * ---------------------------------------------------------------- */
    printf("\n====== 示例 2: 不同大小的数组 ======\n");

    IntArray *small = int_array_create(3);
    if (small) {
        small->values[0] = 1;
        small->values[1] = 2;
        small->values[2] = 3;
        int_array_print(small);
        int_array_destroy(small);
        small = NULL;
    }

    IntArray *large = int_array_create(100);
    if (large) {
        /* 用连续的值填充 */
        for (int i = 0; i < large->length; i++) {
            large->values[i] = i;
        }
        printf("large[0]   = %d\n", large->values[0]);
        printf("large[50]  = %d\n", large->values[50]);
        printf("large[99]  = %d\n", large->values[99]);
        int_array_destroy(large);
        large = NULL;
    }

    /* ----------------------------------------------------------------
     * 示例 3: 柔性数组 + 字符串指针（二维结构）
     * ---------------------------------------------------------------- */
    printf("\n====== 示例 3: StringArray ======\n");

    StringArray *sa = string_array_create(4, "hello");
    if (sa == NULL) {
        fprintf(stderr, "内存分配失败!\n");
        return 1;
    }

    /* 修改部分字符串 */
    free(sa->strings[1]);
    sa->strings[1] = strdup("world");

    free(sa->strings[2]);
    sa->strings[2] = strdup("flexible");

    free(sa->strings[3]);
    sa->strings[3] = strdup("array");

    string_array_print(sa);
    string_array_destroy(sa);
    sa = NULL;

    /* ----------------------------------------------------------------
     * 示例 4: sizeof 输出对比
     * ---------------------------------------------------------------- */
    demonstrate_sizeof();

    printf("\n============================================\n");
    printf("  程序运行完毕\n");
    printf("============================================\n");

    return 0;
}

/* ============================================================================
 * 最佳实践总结:
 *
 * 1. 什么时候使用柔性数组?
 *    - 结构体末尾需要一个大小可变的数组时
 *    - 想减少内存分配次数（一次 malloc 代替两次）
 *    - 需要更好的缓存局部性（数据和结构体在连续内存中）
 *
 * 2. 什么时候应该用指针成员?
 *    - 数组大小在结构体初始化后还需要改变（柔性数组不能 realloc 扩展结构体）
 *    - 需要灵活指向不同位置的数据
 *    - 需要兼容 C89 编译器
 *
 * 3. 注意事项:
 *    - 始终验证 malloc 返回值
 *    - sizeof(Struct) 不包含柔性数组，分配时必须手动加上
 *    - 柔性数组不能作为 stack 变量声明（IntArray x; 是错误的）
 *    - 柔性数组不能出现在 union 中
 *    - C99 之前有一些编译器支持 "struct hack"（arr[1] 模拟），现在应使用标准柔性数组
 * ============================================================================
 */
