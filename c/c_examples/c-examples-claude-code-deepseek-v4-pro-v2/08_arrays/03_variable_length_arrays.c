/**
 * ============================================================
 * 知识点: 变长数组 (Variable-Length Arrays, VLA) - C99
 *
 * VLA 是指在运行时才确定长度的数组,是 C99 引入的特性。
 * 注意: C11 将 VLA 列为可选特性(条件特性),但在主流编译器
 * (GCC, Clang) 中仍默认支持。
 *
 * VLA 的核心特点:
 *   1. 长度在运行时确定(非常量表达式)
 *   2. sizeof VLA 在运行时求值(而非编译时)
 *   3. 支持多维 VLA
 *   4. 可作为函数参数(函数原型中长度用 * 表示)
 *   5. 不执行数组初始化(不能有初始化列表)
 *   6. 不能是 static 或 thread_local
 *   7. 不能作为结构体成员
 *   8. 自动存储期,在离开作用域时释放
 *
 * 编译指令:
 *   gcc 03_variable_length_arrays.c -o 03_variable_length_arrays.exe -std=c11 -Wall
 * 运行:
 *   ./03_variable_length_arrays.exe
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>

/* ======== VLA 作为函数参数 ======== */

/*
 * 方式1: 使用 VLA 语法声明参数
 * int n 必须在 arr[n] 之前声明,以便在参数列表中可见
 * 这允许函数处理不同大小的数组
 */
void print_array(int n, int arr[n])
{
    printf("  数组内容: [");
    for (int i = 0; i < n; i++) {
        printf("%d", arr[i]);
        if (i < n - 1) printf(", ");
    }
    printf("]\n");
}

/*
 * 方式2: 二维 VLA 参数
 * 行数和列数都在运行时确定
 * 注意: 列数 cols 必须在 arr[][cols] 之前声明
 */
void print_matrix(int rows, int cols, int mat[rows][cols])
{
    printf("  %dx%d 矩阵:\n", rows, cols);
    for (int i = 0; i < rows; i++) {
        printf("    ");
        for (int j = 0; j < cols; j++) {
            printf("%4d ", mat[i][j]);
        }
        printf("\n");
    }
}

/*
 * 方式3: 使用 * 作为"不定长度"占位符
 * 这种语法表示函数期望 VLA,但长度信息在别处
 * 必须在参数列表中有前置的大小参数
 */
void fill_identity(int rows, int cols, int mat[rows][cols])
{
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            mat[i][j] = (i == j) ? 1 : 0;
        }
    }
}

/* 使用 * 作为数组维度(函数原型风格) */
void print_diagonal(int rows, int cols, int mat[*][*]);

int main(void)
{
    printf("========================================\n");
    printf("  变长数组 (VLA) 演示\n");
    printf("========================================\n\n");

    /* ======== 1. 基本 VLA 声明 ======== */
    printf("======== 1. 基本 VLA 声明 ========\n");

    int size = 5;
    int vla[size];  /* size 在运行时确定,这就是 VLA */

    /* 给 VLA 赋值 */
    printf("创建 int vla[%d] 并赋值:\n", size);
    for (int i = 0; i < size; i++) {
        vla[i] = (i + 1) * 10;
    }

    for (int i = 0; i < size; i++) {
        printf("  vla[%d] = %d\n", i, vla[i]);
    }
    printf("\n");

    /* ======== 2. sizeof 对 VLA 运行时求值 ======== */
    printf("======== 2. sizeof 对 VLA 求值(运行时) ========\n");

    int n1 = 3;
    int n2 = 7;
    int vla1[n1];
    int vla2[n2];

    printf("int vla1[%d]: sizeof = %zu 字节, 元素数 = %zu\n",
           n1, sizeof(vla1), sizeof(vla1) / sizeof(vla1[0]));
    printf("int vla2[%d]: sizeof = %zu 字节, 元素数 = %zu\n",
           n2, sizeof(vla2), sizeof(vla2) / sizeof(vla2[0]));

    /*
     * 关键区别: 对于 VLA,sizeof 在运行时计算。
     * 对于普通数组(编译时常量大小),sizeof 在编译时计算。
     */
    int normal_arr[10];
    printf("int normal_arr[10]: sizeof = %zu (编译时计算)\n", sizeof(normal_arr));
    printf("int vla1[%d]:       sizeof = %zu (运行时计算)\n\n", n1, sizeof(vla1));

    /* ======== 3. 多维 VLA ======== */
    printf("======== 3. 多维 VLA ========\n");

    int rows = 3, cols = 4;
    int matrix[rows][cols];  /* 二维 VLA */

    /* 赋值 */
    int counter = 1;
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            matrix[i][j] = counter++;
        }
    }

    printf("三维(?) 实际上是 %dx%d 二维VLA:\n", rows, cols);
    for (int i = 0; i < rows; i++) {
        printf("  ");
        for (int j = 0; j < cols; j++) {
            printf("%4d ", matrix[i][j]);
        }
        printf("\n");
    }
    printf("sizeof(matrix) = %zu 字节\n\n", sizeof(matrix));

    /* ======== 4. VLA 作为函数参数 ======== */
    printf("======== 4. VLA 作为函数参数 ========\n");

    /* 创建不同大小的数组并传入同一个函数 */
    int arr1[] = {1, 2, 3};
    int arr2[] = {10, 20, 30, 40, 50};

    printf("传入不同大小的数组给 print_array:\n");
    print_array(3, arr1);
    print_array(5, arr2);
    printf("\n");

    /* 二维 VLA 作为函数参数 */
    int mat[2][3] = {{1, 2, 3}, {4, 5, 6}};
    printf("传入二维 VLA 给 print_matrix:\n");
    print_matrix(2, 3, mat);
    printf("\n");

    /* 函数内部创建 VLA 并通过 VLA 参数修改 */
    printf("创建单位矩阵:\n");
    int identity[3][3];
    fill_identity(3, 3, identity);
    print_matrix(3, 3, identity);
    printf("\n");

    /* ======== 5. 动态调整数组大小(运行时) ======== */
    printf("======== 5. 运行时决定数组大小的实际应用 ========\n");

    /* 模拟用户输入: 根据输入动态决定数组大小 */
    int data_size = 8;  /* 模拟运行时输入 */
    int data[data_size];

    /* 填充斐波那契数列 */
    for (int i = 0; i < data_size; i++) {
        if (i == 0 || i == 1) {
            data[i] = i;
        } else {
            data[i] = data[i-1] + data[i-2];
        }
    }

    printf("前 %d 个斐波那契数(VLA实现):\n", data_size);
    print_array(data_size, data);
    printf("\n");

    /* ======== 6. VLA 的局限性演示 ======== */
    printf("======== 6. VLA 的局限性和注意事项 ========\n");

    printf("1. VLA 不能有初始化列表:\n");
    printf("   错误: int vla[n] = {1,2,3};  // 不允许!\n\n");

    printf("2. VLA 不能是 static:\n");
    printf("   错误: static int vla[n];  // 不允许!\n\n");

    printf("3. VLA 不能是结构体成员:\n");
    printf("   错误: struct S { int len; int arr[len]; };  // 不允许!\n\n");

    printf("4. VLA 不能是全局/文件作用域:\n");
    printf("   错误: int global_vla[n];  // 编译错误!\n\n");

    printf("5. VLA 大小不能是负数或0(会导致未定义行为):\n");
    printf("   建议: 使用前检查大小 > 0\n\n");

    printf("6. 大型 VLA 可能导致栈溢出:\n");
    printf("   VLA 分配在栈上,超大数组可能导致崩溃\n");
    printf("   建议: 超过几KB的数据使用 malloc 动态分配\n\n");

    printf("7. C11 标准中将 VLA 列为可选特性:\n");
    printf("   可以使用 __STDC_NO_VLA__ 宏检查编译器是否支持\n");
#ifdef __STDC_NO_VLA__
    printf("   本编译器不支持 VLA\n");
#else
    printf("   本编译器支持 VLA\n");
#endif

    /* ======== 7. VLA 与指针 ======== */
    printf("\n======== 7. 关于 VLA 指针 ========\n");

    int v_size = 5;
    int v_arr[v_size];

    /* 指向VLA的指针 */
    int (*vla_ptr)[v_size] = &v_arr; /* 指向整个VLA的指针 */

    for (int i = 0; i < v_size; i++) {
        (*vla_ptr)[i] = i * 100;
    }

    printf("通过指向VLA的指针访问:\n");
    for (int i = 0; i < v_size; i++) {
        printf("  v_arr[%d] = %d\n", i, v_arr[i]);
    }

    return 0;
}

/**
 * 使用 VLA 不定长度占位符语法(*)的函数定义
 * 函数原型: void print_diagonal(int rows, int cols, int mat[*][*]);
 */
void print_diagonal(int rows, int cols, int mat[rows][cols])
{
    printf("对角线元素: ");
    for (int i = 0; i < rows && i < cols; i++) {
        printf("%d ", mat[i][i]);
    }
    printf("\n");
}
