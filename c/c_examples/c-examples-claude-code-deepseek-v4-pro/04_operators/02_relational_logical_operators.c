/*
 * ============================================
 * 知识点：关系运算符和逻辑运算符
 * 说明：
 *   关系运算符用于比较两个值的大小关系，
 *   逻辑运算符用于组合多个条件表达式。
 *   它们的结果都是 int 类型（0 表示假，非0表示真）。
 *
 * 关系运算符：
 *   ==  等于       !=  不等于
 *   >   大于       <   小于
 *   >=  大于等于   <=  小于等于
 *
 * 逻辑运算符：
 *   &&  逻辑与（AND）— 两个条件都为真时结果为真
 *   ||  逻辑或（OR） — 至少一个条件为真时结果为真
 *   !   逻辑非（NOT）— 取反
 *
 * 编译方法：
 *   gcc 02_relational_logical_operators.c -o 02_relational_logical_operators
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <stdbool.h>  // C99标准引入的 bool 类型

int main() {
    int a = 10, b = 5, c = 10;

    // ========== 关系运算符 ==========
    printf("===== 关系运算符 =====\n");
    printf("a = %d, b = %d, c = %d\n\n", a, b, c);

    // 关系运算的结果：1（真）或 0（假）
    printf("a == c: %d\n", a == c);   // 1 (true)
    printf("a == b: %d\n", a == b);   // 0 (false)
    printf("a != b: %d\n", a != b);   // 1 (true)
    printf("a >  b: %d\n", a >  b);   // 1 (true)
    printf("a <  b: %d\n", a <  b);   // 0 (false)
    printf("a >= c: %d\n", a >= c);   // 1 (true)
    printf("b <= a: %d\n", b <= a);   // 1 (true)

    // 关系运算用于条件判断
    printf("\n===== 条件判断示例 =====\n");
    if (a > b) {
        printf("a 大于 b\n");
    }

    if (a == c) {
        printf("a 等于 c\n");
    }

    // ========== 逻辑运算符 ==========
    printf("\n===== 逻辑运算符 =====\n");
    int age = 25;
    int height = 180;

    // 逻辑与 &&：两个条件都为真才为真
    if (age > 18 && height > 170) {
        printf("年龄大于18 且 身高大于170: 条件满足\n");
    }

    // 逻辑或 ||：至少一个条件为真即为真
    int score = 85;
    if (score < 60 || score > 90) {
        printf("成绩 %d 要么不及格，要么优秀\n", score);
    } else {
        printf("成绩 %d 在60-90之间\n", score);
    }

    // 逻辑非 !：取反
    bool is_admin = false;
    if (!is_admin) {
        printf("当前用户不是管理员\n");
    }

    // ========== 短路求值 ==========
    printf("\n===== 短路求值 =====\n");
    /*
     * && 和 || 具有短路特性：
     * - 对于 &&，如果左侧为假，右侧不再计算
     * - 对于 ||，如果左侧为真，右侧不再计算
     */
    int x = 0;

    // && 短路：左侧为假，右侧不执行
    int result = (x != 0) && (10 / x > 2);  // 不会发生除0错误！
    printf("短路 && 避免除零: (x != 0) && (10 / x > 2) = %d\n", result);

    // || 短路：左侧为真，右侧不执行
    result = (x == 0) || (10 / x > 2);  // 不会发生除0错误！
    printf("短路 || 避免除零: (x == 0) || (10 / x > 2) = %d\n", result);

    // ========== bool 类型 ==========
    printf("\n===== bool 类型（C99） =====\n");
    /*
     * C99 引入了 _Bool 类型和 <stdbool.h> 头文件。
     * bool 是 _Bool 的别名，true 是 1，false 是 0。
     */
    bool is_raining = true;
    bool is_cold    = false;

    if (is_raining && is_cold) {
        printf("下雨又冷，不出门\n");
    } else if (is_raining || is_cold) {
        printf("要么下雨要么冷\n");
    } else {
        printf("天气好，出门！\n");
    }

    // 在C语言中，任何非0值都被视为"真"
    printf("\n===== C语言的真值概念 =====\n");
    printf("如果 if(0) 判断为: %s\n", 0 ? "真" : "假");
    printf("如果 if(1) 判断为: %s\n", 1 ? "真" : "假");
    printf("如果 if(42) 判断为: %s\n", 42 ? "真" : "假");
    printf("如果 if(-1) 判断为: %s\n", -1 ? "真" : "假");
    printf("如果 if(3.14) 判断为: %s\n", 3.14 ? "真" : "假");

    // ========== 常见陷阱 ==========
    printf("\n===== 常见陷阱 =====\n");
    int value = 5;

    // 陷阱：把 == 写成 =
    if (value = 10) {  // 赋值语句，value变为10，表达式值为10（真）
        printf("警告：value = %d，条件总是真！(应为 == )\n", value);
    }

    // 最佳实践：常量放在左边，防止误写
    // if (10 = value)  // 编译错误！不能给常量赋值
    // 正确写法：if (10 == value)

    // 浮点数比较
    float f1 = 0.1f + 0.2f;
    float f2 = 0.3f;
    // if (f1 == f2)  // 危险！浮点数精度问题
    // 应该使用容忍度比较
    float eps = 0.00001f;
    if (f1 - f2 < eps && f2 - f1 < eps) {
        printf("浮点数 f1 和 f2 在容忍范围内相等\n");
    }

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. 关系运算返回 0 或 1
 * 2. && 和 || 有短路求值特性
 * 3. C语言中 0 为假，非0为真
 * 4. bool 类型用 #include <stdbool.h>
 * 5. 小心把 == 写成 =
 * 6. 浮点数不要直接用 == 比较
 * ============================================
 */
