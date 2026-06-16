/*
 * ============================================================
 *  知识点: 关系运算符与三元运算符
 *
 *  本文件覆盖以下核心概念:
 *    1. 关系运算符: ==、!=、<、>、<=、>=
 *    2. 三元（条件）运算符: condition ? expr1 : expr2
 *    3. 浮点数比较的注意事项
 *    4. 运算符优先级组合
 *
 *  编译指令:
 *    gcc 03_relational_and_ternary.c -o 03_relational_and_ternary.exe -std=c11 -Wall
 *
 *  运行指令:
 *    ./03_relational_and_ternary.exe
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <math.h>       /* fabs() 用于绝对值计算 */

int main(void)
{
    printf("========================================\n");
    printf("   关系运算符与三元运算符\n");
    printf("========================================\n\n");

    /*
     * ============================================
     *  1. 关系运算符（Relational Operators）
     * ============================================
     *
     *  运算符  含义          示例         说明
     *  ==      等于          a == b      比较两个值是否相等
     *  !=      不等于        a != b      比较两个值是否不相等
     *  <       小于          a < b       检查 a 是否小于 b
     *  >       大于          a > b       检查 a 是否大于 b
     *  <=      小于等于      a <= b      检查 a 是否小于等于 b
     *  >=      大于等于      a >= b      检查 a 是否大于等于 b
     *
     *  关系运算的结果是 int 类型: 1（真）或 0（假）
     */
    printf("===== 1. 关系运算符 =====\n");
    printf("在 C 语言中，关系运算的结果是整数:\n");
    printf("  真（true）  = 1\n");
    printf("  假（false） = 0\n\n");

    int a = 10, b = 5, c = 10;

    printf("a = %d, b = %d, c = %d\n\n", a, b, c);

    printf("a == b: %d (%s)\n", a == b, (a == b) ? "真" : "假");
    printf("a != b: %d (%s)\n", a != b, (a != b) ? "真" : "假");
    printf("a <  b: %d (%s)\n", a < b,  (a < b)  ? "真" : "假");
    printf("a >  b: %d (%s)\n", a > b,  (a > b)  ? "真" : "假");
    printf("a <= c: %d (%s)\n", a <= c, (a <= c) ? "真" : "假");
    printf("a >= c: %d (%s)\n\n", a >= c, (a >= c) ? "真" : "假");

    /*
     * 关系运算的结果可以赋值给变量或用在表达式中
     */
    int result = (a == c);   /* result 为 1 */
    printf("int result = (a == c);  result = %d\n\n", result);

    /*
     * ============================================
     *  2. 常见的陷阱
     * ============================================
     */

    /* 陷阱: = 和 == 混淆 */
    /* if (x = 10)  这是一个常见的错误！= 是赋值，结果恒为真 */
    /* 正确的写法: if (x == 10) */
    printf("===== 2. 常见陷阱 =====\n");
    printf("陷阱 1: '=' 是赋值，'==' 是等于比较\n");
    printf("  int x = 5;\n");
    printf("  if (x = 10)   -- 这是赋值！x 变成 10，表达式值为 10（真）\n");
    printf("  if (x == 10)  -- 这是正确的比较\n\n");

    /* 陷阱: 浮点数比较 */
    printf("陷阱 2: 浮点数不能直接用 == 比较\n\n");

    /*
     * ============================================
     *  3. 浮点数比较
     * ============================================
     */
    printf("===== 3. 浮点数安全比较 =====\n");

    double p = 0.1;
    double q = 0.2;
    double sum = p + q;     /* 理论上是 0.3 */

    /* 错误方式: 直接 == 比较 */
    printf("p = %.20f\n", p);
    printf("q = %.20f\n", q);
    printf("p + q = %.20f\n", sum);
    printf("错误比较: (p + q == 0.3) = %s\n\n",
           (sum == 0.3) ? "相等" : "不相等 （出现舍入误差！）");

    /* 正确方式: 比较差值的绝对值是否在一个很小的范围内 */
    double epsilon = 1e-9;  /* 0.000000001，也叫 EPSILON */
    double diff = sum - 0.3;
    diff = (diff > 0) ? diff : -diff;   /* 手动绝对值（不使用 fabs） */
    /* 如果用 math.h: diff = fabs(sum - 0.3); */

    if (diff < epsilon)
    {
        printf("正确比较: |(p+q) - 0.3| = %.2e < %.1e => 视为相等\n\n", diff, epsilon);
    }
    else
    {
        printf("正确比较: |(p+q) - 0.3| = %.2e >= %.1e => 确实不相等\n\n", diff, epsilon);
    }

    /*
     * ============================================
     *  4. 三元运算符（Ternary Operator）
     * ============================================
     *
     *  语法: condition ? expr1 : expr2
     *
     *  执行流程:
     *    如果 condition 为真（非 0），整个表达式的值为 expr1
     *    如果 condition 为假（0），整个表达式的值为 expr2
     *
     *  三元运算符是"表达式"，不是"语句"。
     *  它可以嵌套，但过度的嵌套会降低可读性。
     */
    printf("===== 4. 三元运算符 ?: =====\n");

    /* 基本用法: 替代简单的 if-else */
    int score = 85;
    const char *grade = (score >= 60) ? "及格" : "不及格";
    printf("分数 %d: %s\n\n", score, grade);

    /* 三元运算符用于赋值 */
    int max_val;
    int v1 = 100, v2 = 200;
    max_val = (v1 > v2) ? v1 : v2;
    printf("最大值: max(%d, %d) = %d\n", v1, v2, max_val);

    /* 三元运算符用于 printf 中 */
    int temperature = 30;
    printf("今天天气: %s\n", (temperature > 25) ? "炎热" : "凉爽");

    /* 嵌套的三元运算符（谨慎使用，过度嵌套影响可读性）*/
    int num = 0;
    const char *sign = (num > 0) ? "正数" : (num < 0) ? "负数" : "零";
    printf("num = %d 是 %s\n\n", num, sign);

    /*
     * ============================================
     *  5. 三元运算符 vs if-else
     * ============================================
     */
    printf("===== 5. 三元运算符 vs if-else =====\n");

    /* if-else 版本 */
    int age = 20;
    const char *status_if;
    if (age >= 18)
    {
        status_if = "成年";
    }
    else
    {
        status_if = "未成年";
    }

    /* 三元运算符版本（更简洁） */
    const char *status_ternary = (age >= 18) ? "成年" : "未成年";

    printf("age = %d\n", age);
    printf("  if-else 版本: %s\n", status_if);
    printf("  三元版本:     %s\n", status_ternary);
    printf("  结论: 三元运算符使简单的条件赋值更加简洁\n\n");

    /*
     * ============================================
     *  6. 综合示例 —— 实用场景
     * ============================================
     */
    printf("===== 6. 综合示例 =====\n");

    /* 使用三元运算符实现绝对值 */
    int value = -42;
    int abs_value = (value < 0) ? -value : value;
    printf("|%d| = %d\n", value, abs_value);

    /* 限制值在范围内（clamp） */
    int raw = 150;
    int clamped = (raw < 0) ? 0 : (raw > 100) ? 100 : raw;
    printf("clamp(%d, 0, 100) = %d\n", raw, clamped);

    /* 使用关系运算符和三元运算符实现简单的 min/max */
    int arr[] = {34, 12, 89, 5, 67, 23};
    int n = sizeof(arr) / sizeof(arr[0]);
    int min = arr[0], max = arr[0];

    for (int i = 1; i < n; i++)
    {
        min = (arr[i] < min) ? arr[i] : min;
        max = (arr[i] > max) ? arr[i] : max;
    }

    printf("数组: ");
    for (int i = 0; i < n; i++)
    {
        printf("%d ", arr[i]);
    }
    printf("\n最小值: %d\n", min);
    printf("最大值: %d\n", max);

    return 0;
}
