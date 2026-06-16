/*
 * 知识点：数学库函数 (Math Library Functions)
 *
 * 编译指令：gcc 02_math_functions.c -o 02_math_functions.exe -std=c11 -Wall
 * 运行指令：./02_math_functions.exe
 *
 * 本文件演示 <math.h> 中常用的数学函数：
 *   - sin(), cos(), tan()   —— 三角函数
 *   - sqrt(), pow()          —— 平方根和幂
 *   - fabs()                 —— 浮点数绝对值
 *   - floor(), ceil(), round() —— 取整函数
 *   - log(), log10(), exp()  —— 指数和对数
 *   - fmod()                 —— 浮点数取模
 *
 * 注意：
 *   - 在 Linux/macOS 上编译时需要链接数学库：-lm
 *     完整命令：gcc 02_math_functions.c -o 02_math_functions -std=c11 -Wall -lm
 *   - Windows/MinGW 通常不需要 -lm，数学库已包含在标准库中
 *   - 角度与弧度的转换：angle_rad = angle_deg * PI / 180.0
 */

#include "../common/charset.h"
#include <stdio.h>
#include <math.h>

/* 定义圆周率常量，<math.h> 未直接提供 M_PI（非标准） */
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

/* 将角度转换为弧度 */
double deg_to_rad(double degrees) {
    return degrees * M_PI / 180.0;
}

int main() {
    printf("========================================\n");
    printf("  数学库函数演示 (C标准库 <math.h>)\n");
    printf("========================================\n\n");

    /* ===== 1. 三角函数 ===== */
    printf("----- 1. 三角函数 (输入为弧度) -----\n");

    double angle_deg = 45.0;          /* 45度 */
    double angle_rad = deg_to_rad(angle_deg);

    printf("角度: %.1f° = %.6f 弧度\n", angle_deg, angle_rad);
    printf("sin(%.1f°) = %.6f\n", angle_deg, sin(angle_rad));
    printf("cos(%.1f°) = %.6f\n", angle_deg, cos(angle_rad));
    printf("tan(%.1f°) = %.6f\n", angle_deg, tan(angle_rad));

    /* 特殊角：90度（注意浮点数精度） */
    printf("\nsin(90°) = %.10f\n", sin(deg_to_rad(90.0)));
    printf("cos(90°) = %.10f (应为0)\n", cos(deg_to_rad(90.0)));

    /* ===== 2. 平方根和幂 ===== */
    printf("\n----- 2. 平方根和幂函数 -----\n");

    double num = 16.0;
    printf("sqrt(%.1f) = %.1f\n", num, sqrt(num));

    /* pow(base, exponent) —— 计算 base 的 exponent 次方 */
    double base = 2.0;
    double exp_val = 10.0;
    printf("pow(%.1f, %.1f) = %.0f\n", base, exp_val, pow(base, exp_val));

    /* 计算立方根：x^(1/3) */
    double cube = 27.0;
    printf("%.1f 的立方根 = %.1f\n", cube, pow(cube, 1.0 / 3.0));

    /* ===== 3. 绝对值函数 ===== */
    printf("\n----- 3. 浮点数绝对值 -----\n");

    double negative = -3.14159;
    printf("fabs(%.5f) = %.5f\n", negative, fabs(negative));
    printf("fabs(%.5f) = %.5f\n", 3.14159, fabs(3.14159));

    /* 注意：整数绝对值用 abs()（在 <stdlib.h> 中） */
    printf("\n(int)abs(-5) = %d (来自 <stdlib.h>)\n", abs(-5));

    /* ===== 4. 取整函数 ===== */
    printf("\n----- 4. 取整函数 -----\n");

    double values[] = {3.14, 3.78, -3.14, -3.78, 5.0};
    int count = sizeof(values) / sizeof(values[0]);

    printf("  原始值    floor     ceil    round   trunc\n");
    printf("  ------  --------  -------- -------- --------\n");
    for (int i = 0; i < count; i++) {
        double v = values[i];
        /* floor: 向下取整（向负无穷方向） */
        /* ceil : 向上取整（向正无穷方向） */
        /* round: 四舍五入 */
        /* trunc: 截断取整（向零方向），C11 标准函数 */
        printf("  %6.2f   %8.2f %8.2f %8.2f %8.2f\n",
               v, floor(v), ceil(v), round(v), trunc(v));
    }

    /* ===== 5. 指数和对数 ===== */
    printf("\n----- 5. 指数和对数函数 -----\n");

    double x = 2.71828;  /* 近似自然常数 e */
    /* 自然对数 ln(x) */
    printf("log(%.5f) = %.5f (自然对数)\n", x, log(x));

    /* 以 10 为底的对数 */
    printf("log10(100.0) = %.1f\n", log10(100.0));

    /* 自然常数 e 的 x 次方 */
    printf("exp(1.0) = %.6f (自然常数 e)\n", exp(1.0));
    printf("exp(2.0) = %.6f (e^2)\n", exp(2.0));

    /* ===== 6. 浮点数取模 ===== */
    printf("\n----- 6. 浮点数取模 -----\n");

    double a = 10.5;
    double b = 3.2;
    /* fmod(x, y): 返回 x/y 的浮点数余数 */
    printf("fmod(%.1f, %.1f) = %.2f\n", a, b, fmod(a, b));
    printf("验证: %.1f = %.1f * %d + %.2f\n", a, b, (int)(a / b), fmod(a, b));

    /* ===== 7. 其他实用函数 ===== */
    printf("\n----- 7. 其他实用函数 -----\n");

    /* hypot(x, y): 计算 sqrt(x^2 + y^2)，避免中间结果溢出 */
    printf("hypot(3.0, 4.0) = %.1f (勾股定理)\n", hypot(3.0, 4.0));

    /* fmin/fmax: 比较两个浮点数 */
    printf("fmin(3.14, 2.72) = %.2f\n", fmin(3.14, 2.72));
    printf("fmax(3.14, 2.72) = %.2f\n", fmax(3.14, 2.72));

    printf("\n========================================\n");
    printf("  程序结束\n");
    printf("========================================\n");

    return 0;
}
