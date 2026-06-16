/*
 * ============================================
 * 知识点：数学库 <math.h>
 * 说明：
 *   <math.h> 提供了常用的数学函数和常量。
 *   使用数学库时，链接需要加 -lm 选项。
 *
 * 常用函数分类：
 *   三角函数：sin, cos, tan, asin, acos, atan
 *   指数对数：exp, log, log10, pow, sqrt
 *   取整函数：ceil, floor, round, trunc, fmod
 *   绝对值  ：fabs, fmax, fmin
 *   其他    ：hypot, erf, tgamma
 *
 * 编译方法：
 *   gcc 01_math_library.c -o 01_math_library -lm
 *   ⚠ 注意：在 Linux/Unix 上必须加 -lm 链接数学库
 *     Windows 上 MinGW 通常不需要 -lm
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <math.h>  // 数学函数头文件

#ifndef M_PI
#define M_PI 3.14159265358979323846  // π 常量
#endif

int main() {
    printf("===== 数学库 <math.h> =====\n\n");

    // ========== 三角函数 ==========
    printf("--- 三角函数 ---\n");
    double angle = 30.0;  // 角度

    // 角度转弧度：弧度 = 角度 × π / 180
    double rad = angle * M_PI / 180.0;
    printf("角度 %.1f° = %.4f 弧度\n", angle, rad);

    printf("sin(%.1f°) = %.4f\n", angle, sin(rad));
    printf("cos(%.1f°) = %.4f\n", angle, cos(rad));
    printf("tan(%.1f°) = %.4f\n", angle, tan(rad));

    // 反三角函数：已知比值求角度
    double asin_val = asin(0.5);    // 弧度
    printf("asin(0.5) = %.4f 弧度 = %.1f°\n",
           asin_val, asin_val * 180 / M_PI);

    // 勾股定理求斜边
    double a = 3.0, b = 4.0;
    double hyp = hypot(a, b);
    printf("hypot(%.0f, %.0f) = %.0f (勾股定理)\n", a, b, hyp);

    // ========== 指数和对数 ==========
    printf("\n--- 指数与对数 ---\n");

    printf("exp(1.0)  = %.6f (e^1, e=%.6f)\n", exp(1.0), exp(1.0));
    printf("exp(2.0)  = %.6f\n", exp(2.0));

    printf("log(e)    = %.6f (自然对数)\n", log(exp(1.0)));
    printf("log10(100)= %.6f (常用对数)\n", log10(100.0));
    printf("log2(8)   = %.6f (以2为底的对数)\n", log2(8.0));

    // 幂运算
    printf("pow(2, 10) = %.0f (2的10次方)\n", pow(2.0, 10.0));
    printf("pow(16, 0.5) = %.0f (16的平方根)\n", pow(16.0, 0.5));

    // 平方根
    printf("sqrt(144) = %.0f\n", sqrt(144.0));
    printf("cbrt(27)  = %.0f (立方根)\n", cbrt(27.0));

    // ========== 取整函数 ==========
    printf("\n--- 取整函数 ---\n");

    double numbers[] = {3.14, 3.84, -3.14, -3.84};
    int n = sizeof(numbers) / sizeof(numbers[0]);

    for (int i = 0; i < n; i++) {
        printf("  %6.2f → ceil=%5.2f  floor=%5.2f  "
               "round=%5.2f  trunc=%5.2f\n",
               numbers[i],
               ceil(numbers[i]),   // 向上取整
               floor(numbers[i]),  // 向下取整
               round(numbers[i]),  // 四舍五入
               trunc(numbers[i])); // 截断取整
    }

    // ========== 取余和绝对值 ==========
    printf("\n--- 取余与绝对值 ---\n");

    printf("fmod(10.5, 3.2) = %.2f (浮点取余)\n",
           fmod(10.5, 3.2));
    printf("remainder(10.5, 3.2) = %.2f (余数，四舍五入)\n",
           remainder(10.5, 3.2));

    printf("fabs(-5.7) = %.1f (浮点绝对值)\n", fabs(-5.7));
    printf("fmax(3.5, 4.2) = %.1f\n", fmax(3.5, 4.2));
    printf("fmin(3.5, 4.2) = %.1f\n", fmin(3.5, 4.2));

    // ========== 双曲函数 ==========
    printf("\n--- 双曲函数 ---\n");
    printf("sinh(1.0)  = %.4f\n", sinh(1.0));
    printf("cosh(1.0)  = %.4f\n", cosh(1.0));
    printf("tanh(1.0)  = %.4f\n", tanh(1.0));

    // ========== 误差函数与伽马函数 ==========
    printf("\n--- 特殊函数 ---\n");
    printf("erf(1.0)    = %.4f (误差函数)\n", erf(1.0));
    printf("tgamma(5.0) = %.0f (Γ(5) = 4! = 24)\n",
           tgamma(5.0));  // Γ(n) = (n-1)!

    // ========== 实用示例 ==========
    printf("\n===== 实用示例 =====\n");

    // 1. 两点距离
    double x1 = 0, y1 = 0, x2 = 3, y2 = 4;
    double dist = sqrt(pow(x2 - x1, 2) + pow(y2 - y1, 2));
    printf("1. 两点 (%g,%g)-(%g,%g) 距离 = %.2f\n",
           x1, y1, x2, y2, dist);

    // 2. 弧度制转角度制
    double rad_val = 1.0;
    double deg_val = rad_val * 180.0 / M_PI;
    printf("2. %.2f 弧度 = %.2f°\n", rad_val, deg_val);

    // 3. 圆的计算
    double r = 5.0;
    double area = M_PI * r * r;
    double circumference = 2 * M_PI * r;
    printf("3. 半径 %.1f 的圆: 面积=%.2f, 周长=%.2f\n",
           r, area, circumference);

    // 4. 物理：自由落体
    double t = 3.0;           // 时间（秒）
    double g = 9.8;           // 重力加速度
    double height = 0.5 * g * pow(t, 2);
    printf("4. 自由落体 %.1f秒 下落 %.2f 米\n", t, height);

    // ========== 注意事项 ==========
    printf("\n===== 注意事项 =====\n");
    printf("1. 编译时链接 -lm: gcc file.c -o file -lm\n");
    printf("2. 角度函数使用弧度制，不是角度\n");
    printf("3. 注意定义域：sqrt(x≥0), asin(|x|≤1)\n");
    printf("4. 浮点误差可能累积，比较时用容忍度\n");
    printf("5. pow(x, y) 性能较差，整数幂用乘法\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. 三角函数使用弧度制
 * 2. 编译链接需要 -lm（Linux/Unix）
 * 3. 注意函数的定义域和值域
 * 4. 浮点比较使用容忍度（epsilon）
 * 5. M_PI 常量需要自行定义或使用 <math.h>
 * ============================================
 */
