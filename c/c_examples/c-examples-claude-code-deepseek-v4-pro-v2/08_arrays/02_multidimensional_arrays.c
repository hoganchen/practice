/*
 * 知识点：多维数组 (Multidimensional Arrays)
 *
 * 本程序演示 C 语言中二维数组（多维数组）的用法，包括：
 *   1. 二维数组的声明与初始化
 *   2. 行优先存储（Row-major order）的内存布局
 *   3. 使用嵌套循环遍历二维数组
 *   4. 将二维数组传给函数（需要指定列数）
 *
 * 编译与运行：
 *   gcc 02_multidimensional_arrays.c -o 02_multidimensional_arrays.exe -std=c11 -Wall
 *   ./02_multidimensional_arrays.exe
 */

#include "../common/charset.h"
#include <stdio.h>

// 常量定义：数组的行数和列数
#define ROWS 3
#define COLS 4

/*
 * 打印二维数组的函数
 * 注意：必须指定列数（第二维大小），否则编译器无法计算偏移
 * 二维数组在内存中是线性存储的，编译器需要知道每行有多少个元素
 * 才能计算 arr[i][j] 的地址：base + (i * COLS + j) * sizeof(element)
 */
void print_matrix(int rows, int cols, int matrix[rows][cols])
{
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            printf("%4d ", matrix[i][j]);
        }
        printf("\n");
    }
}

/*
C语言获取二维数组的大小
在C语言中，获取二维数组的大小主要使用 sizeof 运算符。以下是常用的方法：

1. 获取行数（第一维大小）
int arr[3][4];
int rows = sizeof(arr) / sizeof(arr[0]);      // 3

2. 获取列数（第二维大小）
int arr[3][4];
int cols = sizeof(arr[0]) / sizeof(arr[0][0]); // 4

3. 完整示例
#include <stdio.h>

int main() {
    int arr[3][4] = {
        {1, 2, 3, 4},
        {5, 6, 7, 8},
        {9, 10, 11, 12}
    };

    int rows = sizeof(arr) / sizeof(arr[0]);          // 行数: 3
    int cols = sizeof(arr[0]) / sizeof(arr[0][0]);    // 列数: 4
    int total = sizeof(arr) / sizeof(arr[0][0]);      // 总元素数: 12

    printf("行数: %d\n", rows);
    printf("列数: %d\n", cols);
    printf("总元素数: %d\n", total);

    // 遍历
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            printf("%2d ", arr[i][j]);
        }
        printf("\n");
    }

    return 0;
}

4. 封装成宏（推荐）
#define ROWS(arr)    (sizeof(arr) / sizeof(arr[0]))
#define COLS(arr)    (sizeof(arr[0]) / sizeof(arr[0][0]))
#define TOTAL(arr)   (sizeof(arr) / sizeof(arr[0][0]))

// 使用
int arr[3][4];
printf("rows=%zu, cols=%zu, total=%zu\n", ROWS(arr), COLS(arr), TOTAL(arr));
// 输出: rows=3, cols=4, total=12

⚠️ 注意
sizeof 只在数组定义的作用域内有效。如果把数组传给函数，它会退化为指针，sizeof 就得不到正确结果了：

// ❌ 错误：arr 退化为指针
void print_size(int arr[3][4]) {
    printf("%zu", sizeof(arr) / sizeof(arr[0])); // 不是 3！
}

// ✅ 正确：需要把维度也传进来
void print_size(int arr[3][4], int rows, int cols) {
    for (int i = 0; i < rows; i++)
        for (int j = 0; j < cols; j++)
            printf("%d ", arr[i][j]);
}
*/
int main(void)
{
    /* ========== 1. 二维数组声明与初始化 ========== */

    // 声明一个 3 行 4 列的二维数组
    // 逻辑上：3 行，每行 4 个整数
    int matrix[ROWS][COLS];
    (void)matrix;  // 抑制未使用警告，仅用于演示声明语法

    // 完全初始化：外层大括号表示行，内层大括号表示每行的元素
    int grid[3][4] = {
        { 1,  2,  3,  4 },   // 第 0 行
        { 5,  6,  7,  8 },   // 第 1 行
        { 9, 10, 11, 12 }    // 第 2 行
    };

    // 内层大括号可以省略，按行优先顺序填充
    // 下面与上面的初始化等价
    int grid2[3][4] = {
        { 1, 2, 3, 4 },
        { 5, 6, 7, 8 },
        { 9, 10, 11, 12 }
    };
    (void)grid2;  // 抑制未使用警告

    // 部分初始化：未指定的元素为 0
    int partial[3][4] = {
        { 1, 2 },       // 第 0 行：1, 2, 0, 0
        { 3, 4, 5 },    // 第 1 行：3, 4, 5, 0
        { 6 }           // 第 2 行：6, 0, 0, 0
    };

    // 使用 designated initializers
    int designated[3][4] = {
        [0][0] = 10,
        [1][1] = 20,
        [2][3] = 30
    };


    /* ========== 2. 行优先存储（Row-major Order） ========== */

    /*
     * C 语言采用行优先存储：
     *   第一行的所有元素连续存储
     *   接着存储第二行的所有元素
     *   以此类推...
     *
     * 内存布局（grid）：
     *   地址从低到高：
     *   [0][0] [0][1] [0][2] [0][3] | [1][0] [1][1] [1][2] [1][3] | [2][0] [2][1] [2][2] [2][3]
     *   <------ 第 0 行 -------->   <------ 第 1 行 -------->   <------ 第 2 行 -------->
     */

    printf("=== 二维数组内存布局（行优先）===\n");
    printf("grid 数组在内存中实际存储顺序：\n");
    // 将二维数组当作一维数组来查看内存布局
    int *ptr = (int *)grid;  // 二维数组名强制转为 int*，便于线性访问
    for (int i = 0; i < 12; i++) {
        printf("grid[%2d] = %2d  ", i, ptr[i]);
        if ((i + 1) % 4 == 0) printf("\n");  // 每 4 个元素换行
    }
    printf("\n");


    /* ========== 3. 嵌套循环遍历 ========== */

    printf("=== 嵌套循环遍历 grid ===\n");
    for (int i = 0; i < 3; i++) {          // 外层循环：遍历行
        printf("第 %d 行: ", i);
        for (int j = 0; j < 4; j++) {      // 内层循环：遍历列
            printf("%4d ", grid[i][j]);
        }
        printf("\n");
    }
    printf("\n");


    /* ========== 4. 使用函数打印二维数组 ========== */

    printf("=== 函数打印 partial 数组 ===\n");
    /*
     * C99 开始支持变长数组（VLA）参数语法，可以传入行列数
     * 更传统的写法是：void print_matrix(int matrix[][COLS], int rows)
     * 必须指定列数 COLS！
     */
    print_matrix(3, 4, partial);

    printf("\n");

    printf("=== 函数打印 designated 数组 ===\n");
    print_matrix(3, 4, designated);
    printf("\n");


    /* ========== 5. 三维数组示例（三维或更高维同理） ========== */

    printf("=== 三维数组 ===\n");
    // 声明并初始化一个 2×3×4 的三维数组
    int cube[2][3][4] = {
        {
            { 1,  2,  3,  4 },
            { 5,  6,  7,  8 },
            { 9, 10, 11, 12 }
        },
        {
            { 13, 14, 15, 16 },
            { 17, 18, 19, 20 },
            { 21, 22, 23, 24 }
        }
    };

    // 遍历三维数组：三层嵌套循环
    for (int i = 0; i < 2; i++) {
        printf("层 %d:\n", i);
        for (int j = 0; j < 3; j++) {
            for (int k = 0; k < 4; k++) {
                printf("%4d ", cube[i][j][k]);
            }
            printf("\n");
        }
        printf("\n");
    }


    /* ========== 6. 使用 sizeof 计算多维数组 ========== */

    printf("=== sizeof 计算多维数组 ===\n");
    printf("sizeof(grid)       = %zu 字节（整个数组）\n", sizeof(grid));
    printf("sizeof(grid[0])    = %zu 字节（第一行，即 4 个 int）\n", sizeof(grid[0]));
    printf("sizeof(grid[0][0]) = %zu 字节（一个元素）\n", sizeof(grid[0][0]));
    printf("行数 = %zu\n", sizeof(grid) / sizeof(grid[0]));
    printf("列数 = %zu\n", sizeof(grid[0]) / sizeof(grid[0][0]));

    return 0;
}
