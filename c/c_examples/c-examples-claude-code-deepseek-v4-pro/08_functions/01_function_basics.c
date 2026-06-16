/*
 * ============================================
 * 知识点：函数基础
 * 说明：
 *   函数是将一组操作封装在一起的代码块。
 *   它可以提高代码的复用性、可读性和可维护性。
 *
 * 函数定义语法：
 *   返回类型 函数名(参数列表) {
 *       函数体
 *   }
 *
 * 函数三要素：
 *   1. 定义 — 实现函数功能
 *   2. 声明（原型）— 告知编译器函数的存在
 *   3. 调用 — 使用函数
 *
 * 编译方法：
 *   gcc 01_function_basics.c -o 01_function_basics
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"

// ========== 函数声明（原型） ==========
/*
 * 在使用函数之前，必须先声明或定义它。
 * 函数声明告诉编译器函数的名称、返回类型和参数类型。
 * 这样可以先调用函数，后定义函数。
 */

// 声明一个无参数、无返回值的函数
void print_separator(void);

// 声明一个有参数、有返回值的函数
int add(int a, int b);

// 声明一个打印欢迎信息的函数
void greet(const char *name);

// ========== 函数定义 ==========

/*
 * 函数：计算两个整数的和
 * 参数：a, b — 两个整数
 * 返回值：a + b 的结果
 * 说明：这是最简单的有返回值函数
 */
int add(int a, int b) {
    int result = a + b;
    return result;  // 返回计算结果
}

/*
 * 函数：打印分隔线
 * 参数：无（void 表示没有参数）
 * 返回值：无（void 表示没有返回值）
 */
void print_separator(void) {
    printf("========================\n");
}

/*
 * 函数：打印问候语
 * 参数：name — 人名
 * 返回值：无
 */
void greet(const char *name) {
    // 函数体内部可以定义变量
    printf("你好，%s！欢迎学习C语言！\n", name);
}

/*
 * 函数：判断是否为闰年
 * 参数：year — 年份
 * 返回值：1（是闰年）或 0（不是闰年）
 */
int is_leap_year(int year) {
    // 闰年规则：能被400整除，或能被4整除但不能被100整除
    if ((year % 400 == 0) || (year % 4 == 0 && year % 100 != 0)) {
        return 1;  // 是闰年
    }
    return 0;  // 不是闰年
}

/*
 * 函数：求最大公约数（欧几里得算法）
 * 参数：a, b — 两个正整数
 * 返回值：最大公约数
 */
int gcd(int a, int b) {
    while (b != 0) {
        int temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

// ========== main 函数 — 程序入口 ==========
int main() {
    // ========== 调用无参数函数 ==========
    print_separator();
    printf("函数基础示例\n");
    print_separator();

    // ========== 调用有参数、有返回值的函数 ==========
    int sum = add(5, 3);
    printf("5 + 3 = %d\n", sum);

    // 函数调用可以直接作为表达式
    printf("10 + 20 = %d\n", add(10, 20));
    printf("100 + 200 = %d\n", add(100, 200));

    // 函数调用可以作为参数传递给另一个函数
    printf("add(add(1,2), add(3,4)) = %d\n",
           add(add(1, 2), add(3, 4)));

    // ========== 调用带返回值的函数 ==========
    print_separator();
    printf("\n闰年判断:\n");
    int years[] = {1900, 2000, 2024, 2025};
    int num_years = sizeof(years) / sizeof(years[0]);

    for (int i = 0; i < num_years; i++) {
        if (is_leap_year(years[i])) {
            printf("%d 年是闰年\n", years[i]);
        } else {
            printf("%d 年不是闰年\n", years[i]);
        }
    }

    // ========== 调用 void 函数 ==========
    print_separator();
    greet("张三");
    greet("李四");

    // ========== 函数组合使用 ==========
    print_separator();
    printf("\n最大公约数:\n");
    printf("gcd(12, 8) = %d\n", gcd(12, 8));
    printf("gcd(100, 35) = %d\n", gcd(100, 35));
    printf("gcd(17, 5) = %d\n", gcd(17, 5));

    // ========== 函数调用栈（概念说明） ==========
    printf("\n===== 函数执行流程 =====\n");
    printf("1. main() 开始执行\n");
    printf("2. 调用 add() → 暂停 main，执行 add\n");
    printf("3. add() 返回计算结果\n");
    printf("4. 恢复 main() 继续执行\n");
    printf("5. main() 结束\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. 函数定义：返回类型 + 函数名 + 参数 + 函数体
 * 2. 函数声明（原型）：让编译器在定义之前知道函数信息
 * 3. void 表示没有返回值或没有参数
 * 4. return 返回值并退出函数
 * 5. 函数可以互相调用，但不能嵌套定义
 * ============================================
 */
