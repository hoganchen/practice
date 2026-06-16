/**
 * ============================================================
 * 知识点: 函数定义与调用 (Function Definition and Calling)
 * ============================================================
 *
 * 【编译指令】
 *   gcc 01_function_basics.c -o 01_function_basics.exe -std=c11 -Wall
 *
 * 【运行指令】
 *   ./01_function_basics.exe
 *
 * 【知识点概述】
 *   函数是 C 语言中代码组织和复用的基本单位。包括：
 *     - 函数声明（原型，prototype）与函数定义（definition）
 *     - 形式参数（parameter）与实际参数（argument）
 *     - 返回值与 void 类型
 *     - 函数调用栈的概念
 *     - 多个参数和多种返回类型
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>

// =============================================================
// 函数声明（函数原型）
//
// 在 C 语言中，如果一个函数在被调用之后才定义，必须在调用前
// 声明该函数。函数声明告诉编译器函数的返回类型、名称和参数类型。
//
// 语法: 返回类型 函数名(参数类型列表);
// =============================================================

// 声明一个无参数、无返回值的函数
void print_welcome(void);

// 声明一个有参数、无返回值的函数
void print_number(int n);

// 声明一个有参数、有返回值的函数
int add(int a, int b);

// 声明一个带多个参数的函数
double calculate_average(int a, int b, int c);

// 声明一个带数组参数的函数
int find_max(int arr[], int size);

// 声明嵌套调用的函数（定义在 main 之后）
void outer_function(void);
void inner_function(void);
void deepest_function(void);

// 声明 multiply 函数（定义在 main 之后）
double multiply(double a, double b);

/**
 * 主函数 —— 程序的入口点
 * 程序从 main 函数开始执行
 */
int main(void)
{
    printf("========================================\n");
    printf("  函数定义与调用 示例\n");
    printf("========================================\n\n");

    // ---------------------------------------------------------
    // 示例 1: 调用无参数无返回值的函数
    // ---------------------------------------------------------
    printf("【示例 1】调用无参数无返回值的函数\n");

    // 函数调用：函数名(实际参数)
    print_welcome();  // 没有参数，不接收返回值
    printf("\n");

    // ---------------------------------------------------------
    // 示例 2: 调用有参数无返回值的函数
    // ---------------------------------------------------------
    printf("【示例 2】调用有参数无返回值的函数\n");

    print_number(42);
    print_number(100);
    printf("\n");

    // ---------------------------------------------------------
    // 示例 3: 调用有参数有返回值的函数
    // ---------------------------------------------------------
    printf("【示例 3】调用有参数有返回值的函数\n");

    // 函数调用作为表达式的一部分
    int sum_result = add(15, 27);

    printf("  15 + 27 = %d\n", sum_result);

    // 函数调用可以直接作为参数传递给另一个函数
    printf("  100 + 200 = %d\n", add(100, 200));
    printf("\n");

    // ---------------------------------------------------------
    // 示例 4: 调用带多个参数的函数
    // ---------------------------------------------------------
    printf("【示例 4】调用带多个参数的函数\n");

    double avg = calculate_average(85, 92, 78);
    printf("  成绩平均分: %.2f\n\n", avg);

    // ---------------------------------------------------------
    // 示例 5: 函数调用的顺序 —— 调用栈概念
    // ---------------------------------------------------------
    printf("【示例 5】函数调用栈（模拟嵌套调用）\n");

    // 函数 A 调用函数 B，函数 B 调用函数 C
    // 调用栈: main -> outer_function -> inner_function -> deepest_function
    // 返回顺序反过来: deepest_function -> inner_function -> outer_function -> main
    printf("  从 main 函数开始...\n");
    outer_function();
    printf("  返回到了 main 函数。\n");
    printf("\n");

    // ---------------------------------------------------------
    // 示例 6: 函数调用数组的处理
    // ---------------------------------------------------------
    printf("【示例 6】函数处理数组\n");

    int scores[] = {34, 78, 91, 56, 88, 72, 65};
    int size = sizeof(scores) / sizeof(scores[0]);

    int max_score = find_max(scores, size);
    printf("  最高分是: %d\n\n", max_score);

    // ---------------------------------------------------------
    // 示例 7: 函数原型的重要性和作用域
    // 如果函数在调用之后才定义，必须在使用前声明原型
    // ---------------------------------------------------------
    printf("【示例 7】函数原型的作用\n");

    double result = multiply(3.5, 4.0);
    printf("  3.5 * 4.0 = %.2f\n\n", result);

    // ---------------------------------------------------------
    // 函数调用栈图解说明
    // ---------------------------------------------------------
    printf("========================================\n");
    printf("  函数调用栈（Call Stack）说明:\n\n");
    printf("  当 main 调用 function_a:\n");
    printf("    栈顶 [function_a 的栈帧]  ← 当前执行\n");
    printf("         [main 的栈帧]\n");
    printf("         ...\n\n");
    printf("  当 function_a 调用 function_b:\n");
    printf("    栈顶 [function_b 的栈帧]  ← 当前执行\n");
    printf("         [function_a 的栈帧]\n");
    printf("         [main 的栈帧]\n");
    printf("         ...\n\n");
    printf("  返回时，栈帧依次弹出，回到调用者\n");
    printf("========================================\n");

    return 0;
}

// =============================================================
// 函数定义（实现部分）
// =============================================================

/**
 * print_welcome - 打印欢迎信息
 * @void: 不接受任何参数
 *
 * 返回: void（无返回值）
 */
void print_welcome(void)
{
    // void 类型的函数不需要 return 语句
    // 也可以写 return; 表示提前返回
    printf("  === 欢迎来到 C 语言函数世界！===\n");
}

/**
 * print_number - 打印一个整数
 * @n: 要打印的整数
 *
 * 返回: void（无返回值）
 * 这是一个带参数但无返回值的函数
 */
void print_number(int n)
{
    printf("  传入的数字是: %d\n", n);
    // return;  // 可选的，void 函数可以省略 return
}

/**
 * add - 计算两个整数的和
 * @a: 第一个加数
 * @b: 第二个加数
 *
 * 返回: int，两数之和
 * 这是一个带参数并有返回值的函数
 */
int add(int a, int b)
{
    int sum = a + b;  // 计算和
    return sum;       // 返回结果给调用者
}

/**
 * calculate_average - 计算三个整数的平均值
 * @a: 第一个整数
 * @b: 第二个整数
 * @c: 第三个整数
 *
 * 返回: double，三个数的平均值
 */
double calculate_average(int a, int b, int c)
{
    // 注意：3 要写成 3.0，否则整数除法会丢失小数部分
    double avg = (a + b + c) / 3.0;
    return avg;
}

/**
 * inner_function - 演示函数嵌套调用
 */
void deepest_function(void)
{
    printf("    -> 进入 deepest_function\n");
    printf("    -> 离开 deepest_function\n");
}

void inner_function(void)
{
    printf("    -> 进入 inner_function\n");
    deepest_function();  // 调用 deeper_function
    printf("    -> 离开 inner_function\n");
}

void outer_function(void)
{
    printf("    -> 进入 outer_function\n");
    inner_function();  // 调用 inner_function
    printf("    -> 离开 outer_function\n");
}

/**
 * find_max - 在数组中查找最大值
 * @arr: 整数数组
 * @size: 数组的长度
 *
 * 返回: int，数组中的最大值
 */
int find_max(int arr[], int size)
{
    // 假设第一个元素是最大值
    int max = arr[0];

    // 遍历数组，寻找更大的值
    for (int i = 1; i < size; i++) {
        if (arr[i] > max) {
            max = arr[i];  // 更新最大值
        }
    }

    return max;
}

/**
 * multiply - 计算两个浮点数的乘积
 * @a: 第一个乘数
 * @b: 第二个乘数
 *
 * 返回: double，两数之积
 * 注意：这个函数定义在 main 之后，所以在 main 之前需要函数原型声明
 * 如果没有前面的声明，编译时会报"隐式函数声明"警告或错误
 */
double multiply(double a, double b)
{
    return a * b;
}
