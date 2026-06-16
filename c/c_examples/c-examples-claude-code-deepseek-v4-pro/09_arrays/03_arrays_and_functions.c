/*
 * ============================================
 * 知识点：数组与函数
 * 说明：
 *   数组作为函数参数时会退化为指针，
 *   因此函数内无法用 sizeof 获取数组大小。
 *   需要额外传递数组长度参数。
 *
 *   一维数组参数：
 *     void func(int arr[])       // arr 退化为指针
 *   void func(int *arr)        // 等价写法
 *
 *   二维数组参数：
 *     void func(int arr[][4])   // 必须指定列数
 *   void func(int (*arr)[4])  // 等价写法
 *
 * 编译方法：
 *   gcc 03_arrays_and_functions.c -o 03_arrays_and_functions
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"

// ========== 一维数组作为参数 ==========
/*
 * 下面的三种写法完全等价：
 * void print_int_array(int arr[], int size)
 * void print_int_array(int *arr, int size)
 * void print_int_array(int arr[10], int size)  // 10 被忽略
 *
 * 数组退化为指针，所以必须传递 size
 */

void print_int_array(const int arr[], int size) {
    printf("[");
    for (int i = 0; i < size; i++) {
        printf("%d", arr[i]);
        if (i < size - 1) printf(", ");
    }
    printf("] (size=%d)\n", size);
}

// 数组参数可以被修改（除非加 const）
void double_elements(int arr[], int size) {
    for (int i = 0; i < size; i++) {
        arr[i] *= 2;  // 修改会影响原数组
    }
}

// ========== 二维数组作为参数 ==========
/*
 * 二维数组作为参数时，必须指定列数。
 * void func(int arr[][4], int rows)
 * void func(int (*arr)[4], int rows)  // 等价
 */
void print_matrix(int rows, int cols, int matrix[][4]) {
    // 注意：这里硬编码列数为 4，因为参数类型要求
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            printf("%3d ", matrix[i][j]);
        }
        printf("\n");
    }
}

// 通用方式：使用指针 + 手动计算偏移
void print_matrix_generic(int *matrix, int rows, int cols) {
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            // matrix[i * cols + j] 模拟二维数组访问
            printf("%3d ", matrix[i * cols + j]);
        }
        printf("\n");
    }
}

// ========== 数组查找 ==========
// 线性查找（返回索引，没找到返回 -1）
int linear_search(const int arr[], int size, int target) {
    for (int i = 0; i < size; i++) {
        if (arr[i] == target) {
            return i;
        }
    }
    return -1;
}

// ========== 数组反转 ==========
void reverse_array(int arr[], int size) {
    int left = 0;
    int right = size - 1;

    while (left < right) {
        // 交换左右元素
        int temp = arr[left];
        arr[left] = arr[right];
        arr[right] = temp;
        left++;
        right--;
    }
}

// ========== 数组作为返回值 ==========
/*
 * 函数不能直接返回数组类型。
 * 可以通过返回指针来"返回"数组，
 * 但必须确保指针指向的数据在函数返回后仍然有效。
 */

// 正确方式1：返回静态数组的地址
int *get_fibonacci_10(void) {
    static int fib[10];  // 静态数组，函数返回后仍然存在
    fib[0] = 0;
    fib[1] = 1;
    for (int i = 2; i < 10; i++) {
        fib[i] = fib[i-1] + fib[i-2];
    }
    return fib;  // 返回数组首地址
}

// 正确方式2：通过输出参数返回
void fill_even_numbers(int result[], int size) {
    for (int i = 0; i < size; i++) {
        result[i] = (i + 1) * 2;
    }
}

// ========== 变长数组参数（VLA，C99） ==========
/*
 * C99 引入了变长数组（VLA），可以在运行时确定大小。
 * 可以先传递大小，再使用大小声明数组参数。
 */
void print_vla(int rows, int cols, int matrix[rows][cols]) {
    // matrix 的类型取决于运行时传入的 rows 和 cols
    printf("VLA 矩阵 (%d×%d):\n", rows, cols);
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            printf("%3d ", matrix[i][j]);
        }
        printf("\n");
    }
}

// ========== main ==========
int main() {
    // ========== 一维数组参数 ==========
    printf("===== 一维数组作为参数 =====\n");

    int arr[] = {3, 8, 1, 9, 5, 2, 7, 4, 6};
    int size = sizeof(arr) / sizeof(arr[0]);

    printf("原始数组: ");
    print_int_array(arr, size);

    // 查找元素
    int target = 5;
    int idx = linear_search(arr, size, target);
    if (idx >= 0) {
        printf("找到 %d 在索引 %d\n", target, idx);
    } else {
        printf("没找到 %d\n", target);
    }

    // 反转数组
    reverse_array(arr, size);
    printf("反转后: ");
    print_int_array(arr, size);

    // 加倍元素
    double_elements(arr, size);
    printf("加倍后: ");
    print_int_array(arr, size);

    // ========== 二维数组参数 ==========
    printf("\n===== 二维数组作为参数 =====\n");

    int mat[3][4] = {
        {1, 2, 3, 4},
        {5, 6, 7, 8},
        {9, 10, 11, 12}
    };

    printf("print_matrix:\n");
    print_matrix(3, 4, mat);

    printf("\nprint_matrix_generic (指针方式):\n");
    print_matrix_generic(&mat[0][0], 3, 4);

    // ========== 数组作为返回值 ==========
    printf("\n===== 数组作为返回值 =====\n");

    // 方式1：返回静态数组
    int *fib = get_fibonacci_10();
    printf("斐波那契数列前10项: ");
    for (int i = 0; i < 10; i++) {
        printf("%d ", fib[i]);
    }
    printf("\n");

    // 方式2：通过输出参数
    int evens[8];
    fill_even_numbers(evens, 8);
    printf("前8个偶数: ");
    for (int i = 0; i < 8; i++) {
        printf("%d ", evens[i]);
    }
    printf("\n");

    // ========== const 保护 ==========
    printf("\n===== const 参数保护 =====\n");

    int protected[] = {10, 20, 30, 40, 50};
    // 如果传递 const 数组给非 const 参数的函数...
    // 但这里 protected 本身不是 const，所以没问题
    printf("保护数组: ");
    print_int_array(protected, 5);
    // double_elements(protected, 5);  // 可以修改
    // 但如果将 const int 数组传入可修改的函数会收到警告

    // ========== sizeof 在函数内无效 ==========
    printf("\n===== 函数内 sizeof 的陷阱 =====\n");

    int test[] = {1, 2, 3, 4, 5};
    printf("main 中: sizeof(test) = %zu (整个数组)\n", sizeof(test));

    // 在函数内演示
    void show_sizeof(int arr[]) {
        printf("函数内: sizeof(arr) = %zu (只是指针大小!)\n",
               sizeof(arr));
        printf("因此必须传递 size 参数\n");
    }
    show_sizeof(test);

    // ========== VLA 参数 ==========
    printf("\n===== VLA 变长数组参数 =====\n");

    int vla_mat[2][3] = {{1, 2, 3}, {4, 5, 6}};
    // 在 C99 模式下编译
    print_vla(2, 3, vla_mat);

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. 数组参数退化为指针，丢失大小信息
 * 2. 必须额外传递数组长度
 * 3. 函数内可修改数组元素（除非 const）
 * 4. 二维数组参数必须指定列数
 * 5. 不能直接返回数组，但可返回指针
 * 6. VLA 参数可以动态适应数组大小
 * ============================================
 */
