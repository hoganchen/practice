/*
 * ============================================
 * 知识点：多维数组
 * 说明：
 *   多维数组是"数组的数组"，在内存中以
 *   行优先顺序（row-major）连续存储。
 *
 *   声明：类型 数组名[行数][列数];
 *   本质：int arr[3][4] 是包含 3 个元素
 *        的数组，每个元素是 int[4] 类型
 *
 * 编译方法：
 *   gcc 02_multidimensional_arrays.c -o 02_multidimensional_arrays
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"

#define ROWS 3
#define COLS 4

int main() {
    // ========== 二维数组声明和初始化 ==========
    printf("===== 二维数组初始化 =====\n");

    // 完全初始化
    int matrix1[3][4] = {
        {1, 2, 3, 4},
        {5, 6, 7, 8},
        {9, 10, 11, 12}
    };

    // 也可以全部写在一行（不推荐）
    int matrix2[3][4] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12};

    // 部分初始化（未指定的元素为 0）
    int matrix3[3][4] = {
        {1},
        {2, 3},
        {4, 5, 6}
    };

    // 自动计算行数（必须指定列数）
    int matrix4[][4] = {
        {1, 2, 3, 4},
        {5, 6, 7, 8},
        {9, 10, 11, 12}
    };  // 自动推断为 3 行

    // 全部初始化为 0
    int zeros[3][4] = {0};

    // ========== 打印二维数组 ==========
    printf("\n===== 打印二维数组 =====\n");

    printf("matrix1:\n");
    for (int i = 0; i < ROWS; i++) {
        for (int j = 0; j < COLS; j++) {
            printf("%3d ", matrix1[i][j]);
        }
        printf("\n");
    }

    printf("\nmatrix3 (部分初始化):\n");
    for (int i = 0; i < ROWS; i++) {
        for (int j = 0; j < COLS; j++) {
            printf("%3d ", matrix3[i][j]);
        }
        printf("\n");
    }

    // ========== 访问和修改 ==========
    printf("\n===== 访问和修改 =====\n");

    // 访问特定元素
    printf("matrix1[1][2] = %d\n", matrix1[1][2]);  // 第2行第3列

    // 修改元素
    matrix1[0][0] = 99;
    printf("修改后 matrix1[0][0] = %d\n", matrix1[0][0]);

    // ========== 内存布局 ==========
    printf("\n===== 内存布局（行优先） =====\n");
    /*
     * 二维数组在内存中是线性存储的：
     * [行0] [行1] [行2] ...
     * 每行内部依次排列
     */

    printf("matrix1 在内存中的实际布局:\n");
    // 使用指针访问整个数组的每个字节
    int *p = &matrix1[0][0];  // 指向第一个元素
    for (int i = 0; i < ROWS * COLS; i++) {
        printf("%d ", p[i]);
        if ((i + 1) % COLS == 0) printf("\n");
    }

    // 验证行的连续性
    printf("\n行内元素地址是否连续:\n");
    printf("&matrix1[0][0] = %p\n", &matrix1[0][0]);
    printf("&matrix1[0][3] = %p\n", &matrix1[0][3]);
    printf("&matrix1[1][0] = %p\n", &matrix1[1][0]);
    printf("&matrix1[2][3] = %p\n", &matrix1[2][3]);

    // ========== 三维数组 ==========
    printf("\n===== 三维数组 =====\n");

    // 三维数组：2 个面，3 行，4 列
    int cube[2][3][4] = {
        {
            {1, 2, 3, 4},
            {5, 6, 7, 8},
            {9, 10, 11, 12}
        },
        {
            {13, 14, 15, 16},
            {17, 18, 19, 20},
            {21, 22, 23, 24}
        }
    };

    printf("三维数组 cube[2][3][4]:\n");
    for (int i = 0; i < 2; i++) {
        printf("面 %d:\n", i);
        for (int j = 0; j < 3; j++) {
            for (int k = 0; k < 4; k++) {
                printf("%3d ", cube[i][j][k]);
            }
            printf("\n");
        }
        printf("\n");
    }

    // ========== 二维数组的 sizeof ==========
    printf("\n===== sizeof 与二维数组 =====\n");

    int mat[3][4];
    printf("sizeof(mat)       = %zu 字节 (整个数组)\n", sizeof(mat));
    printf("sizeof(mat[0])    = %zu 字节 (第0行)\n", sizeof(mat[0]));
    printf("sizeof(mat[0][0]) = %zu 字节 (第0行第0列)\n", sizeof(mat[0][0]));
    printf("行数: %zu\n", sizeof(mat) / sizeof(mat[0]));
    printf("列数: %zu\n", sizeof(mat[0]) / sizeof(mat[0][0]));

    // ========== 字符串数组 ==========
    printf("\n===== 字符串数组（二维字符数组） =====\n");

    // 存储多个字符串的二维数组
    char names[5][20] = {
        "Alice",
        "Bob",
        "Charlie",
        "David",
        "Eve"
    };

    printf("名字列表:\n");
    for (int i = 0; i < 5; i++) {
        printf("  %s\n", names[i]);  // names[i] 是第 i 行（字符串）
    }

    // 修改某个字符串
    // names[0] = "Alex";  // 错误！不能直接赋值给数组
    sprintf(names[0], "Alex");  // 使用 sprintf 修改

    printf("\n修改第一个名字后:\n");
    for (int i = 0; i < 5; i++) {
        printf("  %s\n", names[i]);
    }

    // ========== 矩阵转置 ==========
    printf("\n===== 矩阵转置 =====\n");

    int src[2][3] = {{1, 2, 3}, {4, 5, 6}};
    int dst[3][2];  // 转置后的矩阵

    // 转置运算：dst[j][i] = src[i][j]
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 3; j++) {
            dst[j][i] = src[i][j];
        }
    }

    printf("原始 2×3 矩阵:\n");
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 3; j++) {
            printf("%d ", src[i][j]);
        }
        printf("\n");
    }

    printf("\n转置后 3×2 矩阵:\n");
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 2; j++) {
            printf("%d ", dst[i][j]);
        }
        printf("\n");
    }

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. 二维数组是"数组的数组"
 * 2. 内存中按行优先（row-major）存储
 * 3. 声明时必须指定列数
 * 4. sizeof 可以分别计算行数和列数
 * 5. 字符串数组是二维字符数组
 * 6. 常用于矩阵运算、表格数据
 * ============================================
 */
