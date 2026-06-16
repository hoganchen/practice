/*
 * 知识点：数组基础 (Array Basics)
 *
 * 本程序演示 C 语言中一维数组的基本用法，包括：
 *   1. 数组的声明：类型 名称[大小];
 *   2. 数组的初始化：使用 { ... } 语法
 *   3. 数组下标访问（从 0 开始）
 *   4. 使用 sizeof 计算数组大小
 *   5. 数组越界问题（C 语言不进行边界检查）
 *
 * 编译与运行：
 *   gcc 01_array_basics.c -o 01_array_basics.exe -std=c11 -Wall
 *   ./01_array_basics.exe
 */

#include "../common/charset.h"
#include <stdio.h>

int main(void)
{
    /* ========== 1. 数组声明与初始化 ========== */

    // 声明一个包含 5 个整数的数组，未初始化（内容不定）
    int uninitialized[5];
    (void)uninitialized;  // 抑制未使用警告，仅用于演示声明语法

    // 声明并完全初始化（指定所有元素的值）
    int scores[5] = { 95, 87, 78, 92, 88 };

    // 部分初始化：未指定的元素自动初始化为 0
    // 此处 arr[0]=10, arr[1]=20, arr[2]=0, arr[3]=0, arr[4]=0
    int partial[5] = { 10, 20 };

    // 省略大小：编译器根据初始化列表自动推断
    // 此数组大小为 4
    int auto_size[] = { 1, 2, 3, 4 };

    // 使用 designated initializers（C99 起支持）指定特定下标
    int designated[5] = { [1] = 100, [3] = 200 };
    // 结果：{ 0, 100, 0, 200, 0 }


    /* ========== 2. 数组下标访问（0-based） ========== */

    printf("=== 数组下标访问（下标从 0 开始）===\n");
    printf("scores[0] = %d\n", scores[0]);  // 第一个元素
    printf("scores[1] = %d\n", scores[1]);  // 第二个元素
    printf("scores[4] = %d\n", scores[4]);  // 第五个元素

    // 修改数组元素
    scores[2] = 100;
    printf("修改后 scores[2] = %d\n\n", scores[2]);


    /* ========== 3. 使用 sizeof 计算数组大小 ========== */

    printf("=== sizeof 计算数组大小 ===\n");
    // sizeof(scores) 返回整个数组占用的字节数
    // sizeof(scores[0]) 返回一个元素的字节数
    // 两者相除即得元素个数
    int length = (int)(sizeof(scores) / sizeof(scores[0]));
    printf("scores 数组有 %d 个元素\n", length);
    printf("sizeof(scores)       = %zu 字节\n", sizeof(scores));
    printf("sizeof(scores[0])    = %zu 字节\n", sizeof(scores[0]));
    printf("auto_size 元素个数   = %zu\n\n", sizeof(auto_size) / sizeof(auto_size[0]));


    /* ========== 4. 遍历数组 ========== */

    printf("=== 遍历数组 ===\n");
    printf("scores = ");
    for (int i = 0; i < length; i++) {
        printf("%d ", scores[i]);
    }
    printf("\n\n");

    printf("partial = ");
    for (int i = 0; i < 5; i++) {
        printf("%d ", partial[i]);
    }
    printf("\n\n");


    /* ========== 5. 数组越界（危险！C 语言不检查边界） ========== */

    printf("=== 数组越界示例（危险！C 不检查边界）===\n");
    printf("scores 的有效下标是 0~4\n");
    printf("访问 scores[5]（越界）：%d  （这是未定义行为！）\n", scores[5]);
    printf("访问 scores[-1]（越界）：%d （这也是未定义行为！）\n\n", scores[-1]);
    /*
     * 注意：C 语言不会在运行时检查数组下标是否越界。
     * 访问越界元素会读取（或写入）数组之外的内存，导致：
     *   - 程序崩溃（段错误）
     *   - 数据损坏
     *   - 安全漏洞（缓冲区溢出攻击）
     * 永远要确保下标在 0 到 size-1 范围内！
     */


    /* ========== 6. 遍历数组（标准写法） ========== */

    printf("=== 完整遍历 ===");
    for (int i = 0; i < (int)(sizeof(auto_size) / sizeof(auto_size[0])); i++) {
        printf("\nauto_size[%d] = %d", i, auto_size[i]);
    }
    printf("\n\n");

    /* ========== 7. 部分初始化与 designated init 展示 ========== */

    printf("=== 部分初始化结果 ===\n");
    for (int i = 0; i < 5; i++) {
        printf("designated[%d] = %d\n", i, designated[i]);
    }

    return 0;
}
