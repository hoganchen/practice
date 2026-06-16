/*
 * ============================================================
 *  知识点: 浮点类型（Floating Point Types）
 *
 *  本文件覆盖以下核心概念:
 *    1. float、double、long double 三种浮点类型
 *    2. 精度差异以及有效数字位数
 *    3. 浮点数舍入误差（Rounding Error）演示
 *    4. <float.h> 中的常用常量
 *    5. 浮点数比较的注意事项
 *
 *  编译指令:
 *    gcc 02_float_types.c -o 02_float_types.exe -std=c11 -Wall
 *
 *  运行指令:
 *    ./02_float_types.exe
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <float.h>      /* 包含浮点类型的特性常量 */

int main(void)
{
    printf("========================================\n");
    printf("       C语言浮点类型详解\n");
    printf("========================================\n\n");

    /*
     * ============================================
     *  1. 三种浮点类型及其大小
     * ============================================
     *
     *  float       —— 单精度，通常 4 字节（32 位）
     *  double      —— 双精度，通常 8 字节（64 位）
     *  long double —— 扩展精度，通常 8/10/12/16 字节（平台相关）
     *
     *  IEEE 754 标准:
     *    float:   1位符号 + 8位指数 + 23位尾数
     *    double:  1位符号 + 11位指数 + 52位尾数
     */
    printf("===== 1. 各浮点类型占用的字节数 =====\n");
    printf("sizeof(float)       = %zu 字节\n", sizeof(float));
    printf("sizeof(double)      = %zu 字节\n", sizeof(double));
    printf("sizeof(long double) = %zu 字节\n\n", sizeof(long double));

    /*
     * ============================================
     *  2. <float.h> 中的常量
     * ============================================
     *
     *  FLT_ / DBL_ / LDBL_ 前缀分别对应三种浮点类型
     */
    printf("===== 2. <float.h> 中的重要常量 =====\n");

    /* 最大值 */
    printf("float 最大值 (FLT_MAX):       %e\n", FLT_MAX);
    printf("double 最大值 (DBL_MAX):      %e\n", DBL_MAX);
    printf("long double 最大值 (LDBL_MAX): %Le\n\n", LDBL_MAX);

    /* 最小值（最接近 0 的正数） */
    printf("float 最小正值 (FLT_MIN):       %e\n", FLT_MIN);
    printf("double 最小正值 (DBL_MIN):      %e\n", DBL_MIN);
    printf("long double 最小正值 (LDBL_MIN): %Le\n\n", LDBL_MIN);

    /* 精度（有效数字的位数） */
    printf("float 有效数字 (FLT_DIG):       %d 位\n", FLT_DIG);
    printf("double 有效数字 (DBL_DIG):      %d 位\n", DBL_DIG);
    printf("long double 有效数字 (LDBL_DIG): %d 位\n\n", LDBL_DIG);

    /*
     * 精度说明:
     *   float:      约 6~7 位有效数字
     *   double:     约 15~16 位有效数字
     *   long double: 约 18~19 位有效数字（平台相关）
     */

    /*
     * ============================================
     *  3. 精度差异演示
     * ============================================
     */
    printf("===== 3. 精度差异演示 =====\n");

    float f_pi = 3.14159265358979323846f;       /* float，f 后缀 */
    double d_pi = 3.14159265358979323846;       /* double，无后缀 */
    long double ld_pi = 3.14159265358979323846L; /* long double，L 后缀 */

    printf("float       PI = %.15f\n", f_pi);   /* float 精度有限，后面的位是垃圾值 */
    printf("double      PI = %.15f\n", d_pi);   /* double 精度更高 */
    printf("long double PI = %.21Lf\n\n", ld_pi); /* Lf 格式化 long double */

    /*
     * ============================================
     *  4. 浮点数的舍入误差（Rounding Error）
     * ============================================
     *
     *  计算机使用二进制表示浮点数，很多十进制小数无法精确表示。
     *  例如: 0.1 在二进制中是无限循环小数。
     *  这是浮点数的固有限制，不是 bug。
     */
    printf("===== 4. 舍入误差演示 =====\n");

    /* 经典的 0.1 + 0.2 != 0.3 问题 */
    double a = 0.1;
    double b = 0.2;
    double c = a + b;

    printf("a = %.20f\n", a);
    printf("b = %.20f\n", b);
    printf("a + b = %.20f\n", c);
    printf("精确数学值 = 0.3\n");
    printf("是否等于 0.3? %s\n\n", (c == 0.3) ? "是" : "否 -- 出现了舍入误差！");

    /* 累加误差演示 */
    double sum = 0.0;
    for (int i = 0; i < 1000; i++)
    {
        sum += 0.001;   /* 每次加 0.001，1000 次应该等于 1.0 */
    }
    printf("0.001 累加 1000 次 = %.20f\n", sum);
    printf("预期值 = 1.0\n");
    printf("误差 = %e\n\n", sum - 1.0);

    /*
     * ============================================
     *  5. 浮点数比较的注意事项
     * ============================================
     *
     *  由于舍入误差的存在，永远不要直接用 == 比较浮点数！
     *  正确的做法: 比较两个浮点数的"差"是否在一个很小的范围内。
     */
    printf("===== 5. 浮点数安全比较 =====\n");

    /* 错误的比较方式 */
    double x = 0.1 * 3;     /* 数学上等于 0.3 */
    double y = 0.3;

    printf("x = 0.1 * 3 = %.20f\n", x);
    printf("y = 0.3 = %.20f\n", y);
    printf("直接比较 x == y: %s\n\n", (x == y) ? "相等" : "不相等");

    /* 正确的比较方式: 使用一个很小的阈值（epsilon） */
    double epsilon = 1e-9;  /* 0.000000001 */

    if (x - y < epsilon && y - x < epsilon)
    {
        /* 也就是 fabs(x - y) < epsilon，这里没有使用 math.h 中的 fabs */
        printf("正确比较: x 和 y 在误差范围内视为相等\n");
    }
    else
    {
        printf("正确比较: x 和 y 确实不相等\n");
    }

    /*
     * ============================================
     *  6. 特殊浮点值（如果数学计算导致）
     * ============================================
     *
     *  注意: 要产生 INFINITY 和 NAN，需要 <math.h>。
     *  这里仅展示浮点除零的效果。
     *  float.h 中定义了 FLT_EPSILON 等常量。
     */
    printf("\n===== 6. 浮点类型字面量后缀 =====\n");
    printf("float 字面量: 加 f/F 后缀, 如 3.14f\n");
    printf("double 字面量: 不加后缀, 如 3.14\n");
    printf("long double 字面量: 加 l/L 后缀, 如 3.14L\n");
    printf("printf 格式: float/double 用 %%f, long double 用 %%Lf\n");
    printf("scanf 格式: float 用 %%f, double 用 %%lf, long double 用 %%Lf\n");

    return 0;
}
