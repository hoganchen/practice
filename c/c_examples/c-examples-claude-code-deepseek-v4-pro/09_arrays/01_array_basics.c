/*
 * ============================================
 * 知识点：数组基础
 * 说明：
 *   数组是相同类型元素的集合，在内存中连续存储。
 *   数组索引从 0 开始。
 *
 *   声明：类型 数组名[大小];
 *   初始化：类型 数组名[大小] = {值1, 值2, ...};
 *
 *   重要特性：
 *   1. 数组大小必须是编译时常量（C99 支持 VLA）
 *   2. 数组名是首元素的地址（常量指针）
 *   3. 不检查数组边界越界
 *
 * 编译方法：
 *   gcc 01_array_basics.c -o 01_array_basics
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"

#define SIZE 10

int main() {
    // ========== 数组声明和初始化 ==========
    printf("===== 数组声明和初始化 =====\n");

    // 完全初始化
    int a[5] = {1, 2, 3, 4, 5};

    // 部分初始化：未指定的元素默认为 0
    int b[5] = {1, 2};  // 等价于 {1, 2, 0, 0, 0}

    // 自动计算大小（不指定大小，由初始化的元素数决定）
    int c[] = {10, 20, 30, 40, 50};  // 数组大小为 5

    // 指定初始化（C99）：指定某个索引的元素
    int d[10] = {[0] = 100, [3] = 200, [9] = 300};
    // 其他元素默认为 0

    // 全部初始化为 0
    int e[5] = {0};  // {0, 0, 0, 0, 0}

    // 输出数组
    printf("数组 a: ");
    for (int i = 0; i < 5; i++) printf("%d ", a[i]);
    printf("\n");

    printf("数组 b: ");
    for (int i = 0; i < 5; i++) printf("%d ", b[i]);
    printf("\n");

    printf("数组 c: ");
    for (int i = 0; i < 5; i++) printf("%d ", c[i]);
    printf("\n");

    printf("数组 d (指定初始化): ");
    for (int i = 0; i < 10; i++) printf("%d ", d[i]);

    printf("\n\n");

    // ========== 数组的访问和修改 ==========
    printf("===== 访问和修改元素 =====\n");

    int scores[5] = {85, 90, 78, 92, 88};

    printf("原始成绩: ");
    for (int i = 0; i < 5; i++) {
        printf("%d ", scores[i]);
    }

    // 修改元素
    scores[2] = 82;   // 修改第三个元素（索引 2）
    scores[4] += 5;   // 给第五个元素加 5 分

    printf("\n修改后: ");
    for (int i = 0; i < 5; i++) {
        printf("%d ", scores[i]);
    }

    // 计算平均值
    int sum = 0;
    for (int i = 0; i < 5; i++) {
        sum += scores[i];
    }
    printf("\n平均分: %.1f\n", (double)sum / 5);

    // ========== 数组大小 ==========
    printf("\n===== 数组大小 =====\n");

    int arr[] = {1, 2, 3, 4, 5, 6, 7, 8};
    int arr_size = sizeof(arr);              // 整个数组占用字节数
    int element_size = sizeof(arr[0]);       // 单个元素大小
    int element_count = sizeof(arr) / sizeof(arr[0]);  // 元素个数

    printf("数组 arr 的大小: %d 字节\n", arr_size);
    printf("每个 int 元素大小: %d 字节\n", element_size);
    printf("元素个数: %d\n", element_count);

    // sizeof 对数组名操作得到整个数组的大小
    // sizeof 对指针操作得到指针本身的大小（8字节在64位系统）
    int *ptr = arr;
    printf("sizeof(arr) = %zu (整个数组)\n", sizeof(arr));
    printf("sizeof(ptr) = %zu (只是指针大小)\n", sizeof(ptr));

    // ========== 数组边界 ==========
    printf("\n===== 数组边界（危险区域） =====\n");
    /*
     * C语言不检查数组边界！访问越界是未定义行为。
     * 可能导致程序崩溃或数据损坏。
     */
    int safe[3] = {1, 2, 3};

    printf("safe[0] = %d (安全)\n", safe[0]);
    printf("safe[2] = %d (安全，最后一个元素)\n", safe[2]);
    // printf("safe[3] = %d (越界！可能导致崩溃)\n", safe[3]);
    // printf("safe[-1] = %d (越界！负数索引)\n", safe[-1]);

    printf("访问越界是未定义行为，务必避免！\n");

    // ========== 数组遍历 ==========
    printf("\n===== 多种遍历方式 =====\n");

    int data[] = {10, 20, 30, 40, 50};
    int n = sizeof(data) / sizeof(data[0]);

    // 正向遍历
    printf("正向: ");
    for (int i = 0; i < n; i++) {
        printf("%d ", data[i]);
    }
    printf("\n");

    // 反向遍历
    printf("反向: ");
    for (int i = n - 1; i >= 0; i--) {
        printf("%d ", data[i]);
    }
    printf("\n");

    // 跳过元素遍历
    printf("每隔一个: ");
    for (int i = 0; i < n; i += 2) {
        printf("%d ", data[i]);
    }
    printf("\n");

    // ========== 数组的复制 ==========
    printf("\n===== 数组复制 =====\n");
    /*
     * 数组不能直接赋值复制（不能 source = dest）。
     * 需要逐个元素复制。
     */
    int source[5] = {1, 2, 3, 4, 5};
    int dest[5];

    // 逐一复制
    for (int i = 0; i < 5; i++) {
        dest[i] = source[i];
    }

    printf("source: ");
    for (int i = 0; i < 5; i++) printf("%d ", source[i]);
    printf("\ndest:   ");
    for (int i = 0; i < 5; i++) printf("%d ", dest[i]);
    printf("\n");

    // ========== const 数组 ==========
    printf("\n===== const 数组 =====\n");
    const int days[] = {31, 28, 31, 30, 31, 30,
                        31, 31, 30, 31, 30, 31};
    // days[0] = 30;  // 错误！const 数组不可修改

    for (int m = 0; m < 12; m++) {
        printf("%2d 月有 %d 天\n", m + 1, days[m]);
    }

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. 数组索引从 0 开始
 * 2. 数组在内存中连续存储
 * 3. sizeof(arr)/sizeof(arr[0]) 计算元素个数
 * 4. 数组名是常量指针，不能赋值
 * 5. C语言不检查数组边界，程序需自行确保
 * 6. 部分初始化的元素默认为 0
 * ============================================
 */
