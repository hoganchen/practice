/*
 * ============================================
 * 知识点：条件运算符（三元运算符）
 * 说明：
 *   三元运算符 ? : 是C语言中唯一的三目运算符。
 *   语法：条件 ? 表达式1 : 表达式2
 *   如果条件为真（非0），返回表达式1的值，
 *   否则返回表达式2的值。
 *
 *   常用于简化简单的 if-else 语句。
 *
 * 编译方法：
 *   gcc 04_ternary_operator.c -o 04_ternary_operator
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"

int main() {
    // ========== 基本用法 ==========
    printf("===== 三元运算符基本用法 =====\n");

    int score = 85;

    // 三元运算符：根据条件返回不同的值
    char *result = (score >= 60) ? "及格" : "不及格";
    printf("分数 %d: %s\n", score, result);

    // 直接在三元运算符中使用
    score = 45;
    printf("分数 %d: %s\n", score, (score >= 60) ? "及格" : "不及格");

    // ========== 三元运算符 vs if-else ==========
    printf("\n===== 三元 vs if-else =====\n");
    int a = 10, b = 20;

    // 使用三元运算符（简洁）
    int max = (a > b) ? a : b;
    printf("较大值是: %d (使用三元运算符)\n", max);

    // 等价的 if-else（代码更多）
    if (a > b) {
        max = a;
    } else {
        max = b;
    }
    printf("较大值是: %d (使用if-else)\n", max);

    // ========== 三元运算符的嵌套 ==========
    printf("\n===== 三元运算符嵌套 =====\n");
    /*
     * 三元运算符可以嵌套，但过度嵌套会降低可读性。
     * 建议嵌套不超过两层。
     */
    int num = 0;

    char *sign = (num > 0)  ? "正数"
               : (num < 0)  ? "负数"
               :              "零";
    printf("%d 是 %s\n", num, sign);

    num = -5;
    sign = (num > 0) ? "正数" : (num < 0) ? "负数" : "零";
    printf("%d 是 %s\n", num, sign);

    // ========== 在三元中使用表达式 ==========
    printf("\n===== 三元运算符中的表达式 =====\n");
    int x = 5, y = 3;

    // 两个表达式可以是更复杂的计算
    int diff = (x > y) ? (x - y) : (y - x);
    printf("|%d - %d| = %d\n", x, y, diff);

    // ========== 实际应用场景 ==========
    printf("\n===== 实际应用场景 =====\n");

    // 1. 判断奇偶
    int n = 7;
    printf("%d 是%s偶数\n", n, (n % 2 == 0) ? "" : "不");  // 注意用法

    // 2. 取绝对值
    int value = -10;
    int abs_val = (value >= 0) ? value : -value;
    printf("|%d| = %d\n", value, abs_val);

    // 3. 限制范围（clamp）
    int input = 150;
    int clamped = (input < 0)   ? 0
                : (input > 100) ? 100
                :                 input;
    printf("clamp(%d, 0, 100) = %d\n", input, clamped);

    // 4. printf 中直接使用
    int temperature = 30;
    printf("当前温度 %d°C，天气%s炎热\n",
           temperature,
           (temperature > 25) ? "" : "不");

    // 5. 返回值
    int divisor = 0;
    // 避免除零：如果 divisor 为0，返回0
    int safe_divide = (divisor != 0) ? (100 / divisor) : 0;
    printf("100 / %d = %d (安全的除法)\n", divisor, safe_divide);

    // ========== 运算符优先级 ==========
    printf("\n===== 优先级注意事项 =====\n");

    int p = 3, q = 4, r = 5;

    // 错误用法（不加括号）
    int val1 = p > q ? p : q > r ? q : r;
    // 实际解析为：p > q ? p : (q > r ? q : r)
    printf("不加括号: %d (p=%d, q=%d, r=%d)\n", val1, p, q, r);

    // 正确用法（加括号明确意图）
    int val2 = (p > q) ? p : ((q > r) ? q : r);
    printf("加括号:   %d\n", val2);

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. 三元运算符格式：条件 ? 真值 : 假值
 * 2. 适合简洁的条件赋值，不要过度嵌套
 * 3. 复杂逻辑仍建议使用 if-else
 * 4. 注意优先级：三元运算符优先级较低
 * 5. 可以用括号提高可读性
 * ============================================
 */
