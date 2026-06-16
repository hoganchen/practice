/*
 * ============================================
 * 知识点：指针与数组的关系
 * 说明：
 *   数组名本质上就是指向第一个元素的指针（常量指针）。
 *   指针和数组在很多情况下可以互换使用。
 *
 *   关键概念：
 *   - arr[i] 等价于 *(arr + i)
 *   - 数组名是常量指针，不能修改
 *   - 指针可以指向数组，通过指针遍历数组
 *   - 下标运算本质就是指针运算
 *
 * 编译方法：
 *   gcc 02_pointers_and_arrays.c -o 02_pointers_and_arrays
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"

int main() {
    // ========== 数组名就是指针 ==========
    printf("===== 数组名就是指针 =====\n");

    int arr[5] = {10, 20, 30, 40, 50};

    printf("数组名 arr: %p\n", (void*)arr);
    printf("&arr[0]:     %p\n", (void*)&arr[0]);
    printf("arr 和 &arr[0] 相同!\n");

    // 使用数组下标访问
    printf("\n下标访问:\n");
    for (int i = 0; i < 5; i++) {
        printf("arr[%d] = %d\n", i, arr[i]);
    }

    // 使用指针访问（等价）
    printf("\n指针访问:\n");
    for (int i = 0; i < 5; i++) {
        printf("*(arr + %d) = %d\n", i, *(arr + i));
    }

    // ========== 指针 vs 数组名 ==========
    printf("\n===== 指针 vs 数组名 =====\n");
    /*
     * 数组名是常量（不能修改），指针是变量（可以修改）。
     */

    int *p = arr;  // 指针指向数组首元素

    printf("arr 可以赋值给指针 p\n");
    printf("p[2] = %d (用下标访问)\n", p[2]);
    printf("*(p+3) = %d (用指针访问)\n", *(p + 3));

    // 指针可以移动
    p++;  // 指向 arr[1]
    printf("\np++ 后指向 arr[1]: *p = %d\n", *p);
    p += 2;  // 指向 arr[3]
    printf("p += 2 后指向 arr[3]: *p = %d\n", *p);

    // 数组名不能移动
    // arr++;  // 编译错误！数组名不是左值

    // ========== 指针遍历数组的多种方式 ==========
    printf("\n===== 指针遍历数组 =====\n");

    int data[] = {1, 2, 3, 4, 5, 6};
    int size = sizeof(data) / sizeof(data[0]);

    // 方式1：下标
    printf("方式1 (下标): ");
    for (int i = 0; i < size; i++) {
        printf("%d ", data[i]);
    }
    printf("\n");

    // 方式2：指针偏移
    printf("方式2 (指针偏移): ");
    for (int i = 0; i < size; i++) {
        printf("%d ", *(data + i));
    }
    printf("\n");

    // 方式3：指针变量递增
    printf("方式3 (指针递增): ");
    int *ptr = data;
    for (int i = 0; i < size; i++) {
        printf("%d ", *ptr);
        ptr++;  // 指针移动到下一个元素
    }
    printf("\n");

    // 方式4：两个指针之间
    printf("方式4 (指针区间): ");
    int *start = data;
    int *end = data + size;
    while (start < end) {
        printf("%d ", *start);
        start++;
    }
    printf("\n");

    // ========== 指针的 sizeof vs 数组的 sizeof ==========
    printf("\n===== sizeof 区别 =====\n");

    int test[] = {1, 2, 3, 4, 5};
    int *p_test = test;

    printf("sizeof(arr) = %zu (整个数组大小)\n", sizeof(test));
    printf("sizeof(ptr) = %zu (指针本身大小)\n", sizeof(p_test));

    // 计算元素个数
    int count = sizeof(test) / sizeof(test[0]);
    printf("数组元素个数: %d\n", count);

    // ========== 数组名作为函数参数 ==========
    printf("\n===== 数组作为函数参数 =====\n");
    /*
     * 数组作为函数参数时退化为指针。
     * 函数内 sizeof(arr) 得到的是指针大小！
     */

    void print_array_impl(int arr[], int size) {
        printf("函数内 sizeof(arr) = %zu (退化为指针!)\n",
               sizeof(arr));
        for (int i = 0; i < size; i++) {
            printf("%d ", arr[i]);
        }
        printf("\n");
    }

    printf("传递数组给函数:\n");
    print_array_impl(test, 5);

    // ========== 指针数组 vs 数组指针 ==========
    printf("\n===== 指针数组 vs 数组指针 =====\n");

    // 指针数组：每个元素都是指针
    int a1 = 1, a2 = 2, a3 = 3;
    int *ptr_arr[3] = {&a1, &a2, &a3};  // 指针数组
    printf("指针数组: ");
    for (int i = 0; i < 3; i++) {
        printf("%d ", *ptr_arr[i]);
    }
    printf("\n");

    // 数组指针：指向数组的指针
    int matrix[2][3] = {{1, 2, 3}, {4, 5, 6}};
    int (*arr_ptr)[3] = matrix;  // 指向包含3个int的数组的指针
    printf("数组指针: ");
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 3; j++) {
            printf("%d ", arr_ptr[i][j]);
        }
    }
    printf("\n");

    // ========== 负索引（编译器允许但不推荐） ==========
    printf("\n===== 指针与负索引 =====\n");

    int nums[] = {10, 20, 30, 40, 50};
    int *p_nums = &nums[2];  // 指向 30

    printf("p_nums 指向 nums[2] (%d)\n", *p_nums);
    printf("p_nums[-1] = %d (nums[1])\n", p_nums[-1]);
    printf("p_nums[-2] = %d (nums[0])\n", p_nums[-2]);

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. arr[i] 等价于 *(arr + i)
 * 2. 数组名是常量指针，不能修改
 * 3. 函数参数中的数组退化为指针
 * 4. 指针可以递增递减，数组名不能
 * 5. sizeof(数组) ≠ sizeof(指针)
 * 6. 指针数组是数组，数组指针是指针
 * ============================================
 */
