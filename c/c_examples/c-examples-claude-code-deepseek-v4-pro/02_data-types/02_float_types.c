/*
 * ============================================
 * 知识点：浮点类型（float、double、long double）
 * 说明：
 *   浮点类型用于存储带小数点的数。
 *   - float:       4字节，约7位有效数字
 *   - double:      8字节，约15位有效数字（默认）
 *   - long double: 更多精度（依平台而定）
 *
 *   浮点数在内存中以二进制存储，因此
 *   可能存在精度损失，比较时需注意。
 *
 * 编译方法：
 *   gcc 02_float_types.c -o 02_float_types
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <float.h>  // 提供浮点类型的范围常量

int main() {
    // ========== 浮点类型声明 ==========

    // float: 单精度浮点，数值后加 f/F 后缀
    float f = 3.14f;

    // double: 双精度浮点（默认），不需后缀
    double d = 3.141592653589793;

    // long double: 扩展精度浮点，加 L 后缀
    long double ld = 3.14159265358979323846L;

    // ========== sizeof 查看字节数 ==========
    printf("===== 浮点类型占用字节数 =====\n");
    printf("float        : %zu 字节\n", sizeof(float));
    printf("double       : %zu 字节\n", sizeof(double));
    printf("long double  : %zu 字节\n", sizeof(long double));

    // ========== 打印取值范围 ==========
    printf("\n===== 取值范围（来自 float.h） =====\n");
    printf("float  最小值: %e\n", FLT_MIN);
    printf("float  最大值: %e\n", FLT_MAX);
    printf("double 最小值: %e\n", DBL_MIN);
    printf("double 最大值: %e\n", DBL_MAX);
    printf("float  精度(有效数字位数): %d\n", FLT_DIG);
    printf("double 精度(有效数字位数): %d\n", DBL_DIG);

    // ========== 格式化输出 ==========
    /*
     * 浮点数的格式化说明符：
     * %f    — float/double（十进制浮点数）
     * %lf   — double（有时用于 double 输入）
     * %Lf   — long double
     * %e    — 科学计数法
     * %g    — 自动选择 %f 或 %e
     * %.2f  — 保留2位小数
     */

    printf("\n===== 格式化输出示例 =====\n");
    printf("float  pi = %f\n", f);
    printf("double pi = %.15f\n", d);   // 保留15位小数
    printf("科学计数法: %e\n", d);
    printf("自动格式: %g\n", d);

    // ========== 精度演示 ==========
    printf("\n===== 精度对比演示 =====\n");

    float  f_pi = 3.14159265358979323846f;
    double d_pi = 3.14159265358979323846;

    // float 只有约7位有效数字，后面会不准确
    printf("float  pi: %.15f\n", f_pi);
    printf("double pi: %.15f\n", d_pi);

    // ========== 浮点数精度问题 ==========
    printf("\n===== 精度问题演示 =====\n");
    float a = 0.1f;
    float b = 0.2f;
    float sum = a + b;

    // 0.1 + 0.2 在二进制中无法精确表示
    printf("0.1f + 0.2f = %.10f\n", sum);
    printf("理论上应该等于 0.3\n");
    printf("使用 == 比较浮点数很危险！\n");

    // 正确的浮点数比较方式：检查差值是否在容忍范围内
    float target = 0.3f;
    float epsilon = 0.00001f;  // 容忍度
    if ((sum - target) < epsilon && (target - sum) < epsilon) {
        printf("但 |sum - 0.3| < epsilon，视为相等\n");
    }

    // ========== 特殊浮点值 ==========
    printf("\n===== 特殊浮点值 =====\n");

    // 无穷大：除0操作
    double inf = 1.0 / 0.0;
    printf("1.0 / 0.0 = %f (无穷大)\n", inf);

    // 非数字：0/0 或 无穷大运算
    double nan = 0.0 / 0.0;
    printf("0.0 / 0.0 = %f (非数字)\n", nan);

    // 检查是否为有限数、无穷、NaN
    printf("isfinite(inf) = %d\n", __builtin_isfinite(inf));  // 0
    printf("isnan(nan)    = %d\n", __builtin_isnan(nan));     // 1

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. 默认浮点字面量是 double 类型
 * 2. float 加 f/F 后缀，long double 加 L 后缀
 * 3. 浮点数不能直接用 == 比较，需用容忍度
 * 4. 避免用浮点数做精确计算（如货币）
 * 5. 尽量使用 double 获得更高精度
 * ============================================
 */
