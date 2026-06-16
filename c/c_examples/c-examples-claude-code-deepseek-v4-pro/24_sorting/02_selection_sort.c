/*
 * ============================================
 * 知识点：选择排序和插入排序
 * 说明：
 *   选择排序：每次从未排序部分选择最小值
 *            放到已排序部分的末尾。
 *   插入排序：将未排序元素插入到已排序部分
 *            的正确位置。
 *
 * 时间复杂度：
 *   选择排序: O(n²)（所有情况）
 *   插入排序: O(n²)（最坏/平均），O(n)（最好）
 *
 * 空间复杂度：O(1)
 *
 * 编译方法：
 *   gcc 02_selection_sort.c -o 02_selection_sort
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"

void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

void print_array(const int arr[], int size) {
    for (int i = 0; i < size; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");
}

// ========== 选择排序 ==========
/*
 * 思路：
 * 1. 在未排序部分找到最小元素
 * 2. 将最小元素与未排序部分的第一个元素交换
 * 3. 重复直到全部排序
 *
 * 特点：交换次数少（最多 n-1 次），适用于交换开销大的场景
 */
void selection_sort(int arr[], int size) {
    int comparisons = 0;
    int swaps = 0;

    for (int i = 0; i < size - 1; i++) {
        // 在 [i, size-1] 范围找最小值的索引
        int min_idx = i;
        for (int j = i + 1; j < size; j++) {
            comparisons++;
            if (arr[j] < arr[min_idx]) {
                min_idx = j;
            }
        }

        // 将最小值交换到位置 i
        if (min_idx != i) {
            swap(&arr[i], &arr[min_idx]);
            swaps++;
        }
    }

    printf("  比较: %d 次, 交换: %d 次\n", comparisons, swaps);
}

// ========== 插入排序 ==========
/*
 * 思路：
 * 1. 从第一个元素开始，认为已排序
 * 2. 取出下一个元素，与已排序部分从右向左比较
 * 3. 找到正确位置后插入
 *
 * 特点：对接近有序的数组效率很高 O(n)
 */
void insertion_sort(int arr[], int size) {
    int comparisons = 0;
    int shifts = 0;

    for (int i = 1; i < size; i++) {
        int key = arr[i];       // 当前要插入的元素
        int j = i - 1;

        // 在已排序部分从右向左找插入位置
        while (j >= 0 && arr[j] > key) {
            comparisons++;
            arr[j + 1] = arr[j];  // 元素右移
            j--;
            shifts++;
        }

        if (j >= 0) comparisons++;  // 最后一次比较
        arr[j + 1] = key;  // 插入到正确位置
    }

    printf("  比较: %d 次, 移动: %d 次\n", comparisons, shifts);
}

// ========== 插入排序过程演示 ==========
void insertion_sort_trace(int arr[], int size) {
    printf("初始: ");
    print_array(arr, size);

    for (int i = 1; i < size; i++) {
        int key = arr[i];
        int j = i - 1;

        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;

        printf("插入 %2d: ", key);
        print_array(arr, size);
    }
}

// ========== 选择排序 vs 插入排序 ==========
void compare_algorithms(void) {
    printf("\n===== 算法对比 =====\n");

    // 测试1：无序数组
    int arr1[] = {9, 5, 7, 1, 3, 8, 2, 4, 6};
    int arr2[] = {9, 5, 7, 1, 3, 8, 2, 4, 6};
    int size = sizeof(arr1) / sizeof(arr1[0]);

    printf("无序数组:\n");
    printf("原始: ");
    print_array(arr1, size);

    printf("选择排序: ");
    selection_sort(arr1, size);
    printf("结果: ");
    print_array(arr1, size);

    printf("\n插入排序: ");
    insertion_sort(arr2, size);
    printf("结果: ");
    print_array(arr2, size);

    // 测试2：接近有序的数组
    int arr3[] = {1, 2, 3, 4, 6, 5, 7, 8, 9};
    int arr4[] = {1, 2, 3, 4, 6, 5, 7, 8, 9};

    printf("\n接近有序的数组:\n");
    printf("原始: ");
    print_array(arr3, size);

    printf("选择排序: ");
    selection_sort(arr3, size);

    printf("插入排序: ");
    insertion_sort(arr4, size);

    // 测试3：已有序数组
    int arr5[] = {1, 2, 3, 4, 5, 6, 7, 8, 9};
    int arr6[] = {1, 2, 3, 4, 5, 6, 7, 8, 9};

    printf("\n已有序的数组:\n");
    printf("选择排序: ");
    selection_sort(arr5, size);
    printf("插入排序: ");
    insertion_sort(arr6, size);
}

int main() {
    printf("===== 选择排序 =====\n\n");

    // 选择排序
    printf("--- 选择排序 ---\n");
    int arr1[] = {29, 10, 14, 37, 13, 33};
    int size1 = sizeof(arr1) / sizeof(arr1[0]);

    printf("排序前: ");
    print_array(arr1, size1);
    selection_sort(arr1, size1);
    printf("排序后: ");
    print_array(arr1, size1);

    // 插入排序
    printf("\n--- 插入排序 ---\n");
    int arr2[] = {12, 11, 13, 5, 6};
    int size2 = sizeof(arr2) / sizeof(arr2[0]);

    printf("排序前: ");
    print_array(arr2, size2);
    insertion_sort(arr2, size2);
    printf("排序后: ");
    print_array(arr2, size2);

    // 插入排序全过程
    printf("\n--- 插入排序过程 ---\n");
    int arr3[] = {4, 3, 2, 10, 12, 1, 5};
    int size3 = sizeof(arr3) / sizeof(arr3[0]);
    insertion_sort_trace(arr3, size3);

    // 算法对比
    compare_algorithms();

    // 总结
    printf("\n===== 算法总结 =====\n");
    printf("选择排序:\n");
    printf("  O(n²) 比较次数固定，交换次数少\n");
    printf("  不稳定（可能改变相等元素的相对顺序）\n");
    printf("  适用于：数据量小，且交换开销大\n");

    printf("\n插入排序:\n");
    printf("  接近有序时 O(n)\n");
    printf("  稳定排序\n");
    printf("  适用于：数据量小或接近有序的数据\n");

    printf("\n综合建议:\n");
    printf("  数据量 < 10: 插入排序\n");
    printf("  数据量 < 1000: 可选择简单排序\n");
    printf("  数据量大: 使用快速排序/归并排序\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. 选择排序：找最小值交换，交换次数少
 * 2. 插入排序：将元素插入到已排序部分
 * 3. 插入排序在接近有序时非常高效
 * 4. 选择排序不稳定，插入排序稳定
 * 5. 两者时间复杂度都是 O(n²)
 * 6. 实际项目中多用 qsort（快速排序）
 * ============================================
 */
