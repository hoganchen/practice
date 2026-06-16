/*
 * ============================================
 * 知识点：冒泡排序
 * 说明：
 *   冒泡排序通过重复遍历数组，比较相邻
 *   元素并在顺序错误时交换。每轮遍历将
 *   当前最大的元素"冒泡"到末尾。
 *
 * 时间复杂度：
 *   最坏: O(n²)
 *   最好: O(n)（已优化：无交换时提前退出）
 *   平均: O(n²)
 *
 * 空间复杂度：O(1)
 *
 * 编译方法：
 *   gcc 01_bubble_sort.c -o 01_bubble_sort
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <stdbool.h>

// ========== 辅助函数 ==========
void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

void print_array(const int arr[], int size) {
    printf("[");
    for (int i = 0; i < size; i++) {
        printf("%d", arr[i]);
        if (i < size - 1) printf(", ");
    }
    printf("]\n");
}

// ========== 基础冒泡排序 ==========
void bubble_sort_basic(int arr[], int size) {
    // 外层循环：进行 n-1 轮
    for (int i = 0; i < size - 1; i++) {
        // 内层循环：比较相邻元素
        for (int j = 0; j < size - 1 - i; j++) {
            if (arr[j] > arr[j + 1]) {
                // 顺序错误，交换
                swap(&arr[j], &arr[j + 1]);
            }
        }
    }
}

// ========== 优化版冒泡排序 ==========
/*
 * 优化1：如果一轮遍历中没有发生交换，
 *        说明已经有序，提前退出。
 * 优化2：每轮遍历后，末尾的元素已经有序，
 *        可以缩小遍历范围。
 */
void bubble_sort_optimized(int arr[], int size) {
    for (int i = 0; i < size - 1; i++) {
        bool swapped = false;  // 标记本轮是否发生交换

        // 内层循环范围逐渐缩小
        for (int j = 0; j < size - 1 - i; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(&arr[j], &arr[j + 1]);
                swapped = true;
            }
        }

        // 如果没有交换，数组已有序
        if (!swapped) {
            printf("  第 %d 轮无交换，提前结束\n", i + 1);
            break;
        }
    }
}

// ========== 降序冒泡排序 ==========
void bubble_sort_desc(int arr[], int size) {
    for (int i = 0; i < size - 1; i++) {
        for (int j = 0; j < size - 1 - i; j++) {
            if (arr[j] < arr[j + 1]) {  // 改为 <
                swap(&arr[j], &arr[j + 1]);
            }
        }
    }
}

// ========== 冒泡排序过程演示 ==========
void bubble_sort_with_trace(int arr[], int size) {
    printf("初始: ");
    print_array(arr, size);

    for (int i = 0; i < size - 1; i++) {
        bool swapped = false;

        for (int j = 0; j < size - 1 - i; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(&arr[j], &arr[j + 1]);
                swapped = true;
            }
        }

        printf("第 %d 轮: ", i + 1);
        print_array(arr, size);

        if (!swapped) {
            printf("  数组已有序，提前结束\n");
            break;
        }
    }
    printf("最终: ");
    print_array(arr, size);
}

int main() {
    printf("===== 冒泡排序 =====\n\n");

    // ========== 基础版 ==========
    printf("--- 基础版 ---\n");
    int arr1[] = {64, 34, 25, 12, 22, 11, 90};
    int size1 = sizeof(arr1) / sizeof(arr1[0]);

    printf("排序前: ");
    print_array(arr1, size1);

    bubble_sort_basic(arr1, size1);

    printf("排序后: ");
    print_array(arr1, size1);

    // ========== 优化版 ==========
    printf("\n--- 优化版（部分有序数组） ---\n");
    int arr2[] = {1, 2, 3, 5, 4, 6, 7, 8};
    int size2 = sizeof(arr2) / sizeof(arr2[0]);

    printf("排序前: ");
    print_array(arr2, size2);

    bubble_sort_optimized(arr2, size2);

    printf("排序后: ");
    print_array(arr2, size2);

    // ========== 降序 ==========
    printf("\n--- 降序排序 ---\n");
    int arr3[] = {3, 7, 1, 9, 4, 6, 2, 8, 5};
    int size3 = sizeof(arr3) / sizeof(arr3[0]);

    printf("排序前: ");
    print_array(arr3, size3);

    bubble_sort_desc(arr3, size3);

    printf("降序后: ");
    print_array(arr3, size3);

    // ========== 过程演示 ==========
    printf("\n--- 排序过程演示 ---\n");
    int arr4[] = {5, 3, 8, 1, 4};
    int size4 = sizeof(arr4) / sizeof(arr4[0]);

    bubble_sort_with_trace(arr4, size4);

    // ========== 性能总结 ==========
    printf("\n===== 算法总结 =====\n");
    printf("时间复杂度:\n");
    printf("  最坏情况: O(n²) — 逆序数组\n");
    printf("  最好情况: O(n)  — 已有序数组（优化版）\n");
    printf("  平均情况: O(n²)\n");
    printf("空间复杂度: O(1)\n");
    printf("稳定性: 稳定排序（相等元素不交换）\n");
    printf("适用场景: 小规模数据或教学演示\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. 相邻元素比较和交换
 * 2. 每轮将最大元素"冒泡"到末尾
 * 3. 优化：无交换时提前退出
 * 4. 时间复杂度 O(n²)，不适合大规模数据
 * 5. 稳定排序算法
 * ============================================
 */
