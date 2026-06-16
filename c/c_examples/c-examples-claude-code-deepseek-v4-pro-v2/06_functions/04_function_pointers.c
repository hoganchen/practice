/**
 * ============================================================
 * 知识点: 函数指针 (Function Pointers)
 * ============================================================
 *
 * 【编译指令】
 *   gcc 04_function_pointers.c -o 04_function_pointers.exe -std=c11 -Wall
 *
 * 【运行指令】
 *   ./04_function_pointers.exe
 *
 * 【知识点概述】
 *   函数指针是指向函数而非数据的指针。通过函数指针可以间接调用函数。
 *   包括：
 *     - 函数指针的声明语法: 返回类型 (*指针名)(参数类型列表)
 *     - 将函数的地址赋值给函数指针
 *     - 通过函数指针调用函数
 *     - 函数指针作为参数（回调函数）
 *     - 函数指针数组
 *   函数指针是实现回调机制、策略模式、状态机等技术的基础。
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>

// =============================================================
// 一些用于演示的简单函数
// =============================================================

// 两个整数的算术运算函数
int add(int a, int b);       // 加法
int subtract(int a, int b);  // 减法
int multiply(int a, int b);  // 乘法
int divide(int a, int b);    // 除法
int modulo(int a, int b);    // 取模

// 带回调的通用计算函数
int calculate(int x, int y, int (*operation)(int, int));

// 比较函数（用于排序回调）
int ascending(int a, int b);      // 升序比较
int descending(int a, int b);     // 降序比较

// 使用回调的冒泡排序
void bubble_sort(int arr[], int size, int (*compare)(int, int));

// 显示菜单（演示函数指针数组）
typedef int (*math_func)(int, int);  // 定义函数指针类型别名

/**
 * 主函数
 */
int main(void)
{
    printf("========================================\n");
    printf("  函数指针 (Function Pointers) 示例\n");
    printf("========================================\n\n");

    // =========================================================
    // 第一部分: 函数指针的基本语法
    // =========================================================
    printf("========================================\n");
    printf("  第一部分: 基本语法\n");
    printf("========================================\n\n");

    // ---------------------------------------------------------
    // 示例 1: 声明函数指针并赋值
    // ---------------------------------------------------------
    printf("【示例 1】声明函数指针并赋值\n");

    // 声明一个函数指针，指向"返回 int、接受两个 int 参数"的函数
    // 语法解释：
    //   int         = 函数的返回类型
    //   (*ptr)      = 指针变量名（括号必须，否则变成"返回 int* 的函数"）
    //   (int, int)  = 函数的参数类型列表
    int (*func_ptr)(int, int);

    // 将函数名赋值给函数指针
    // 函数名就是函数的地址（类似数组名就是数组首地址）
    func_ptr = add;  // 等价于 func_ptr = &add; 取地址符 & 可选

    // 通过函数指针调用函数
    // 两种方式等价：
    int result1 = func_ptr(10, 5);      // 方式一：直接调用
    int result2 = (*func_ptr)(10, 5);   // 方式二：显式解引用

    printf("  func_ptr 指向 add 函数\n");
    printf("  func_ptr(10, 5)     = %d\n", result1);
    printf("  (*func_ptr)(10, 5)  = %d\n", result2);
    printf("\n");

    // ---------------------------------------------------------
    // 示例 2: 函数指针可以指向不同的函数
    // ---------------------------------------------------------
    printf("【示例 2】函数指针指向不同的函数\n");

    // 指向 subtract
    func_ptr = subtract;
    printf("  func_ptr 指向 subtract: 100 - 30 = %d\n", func_ptr(100, 30));

    // 指向 multiply
    func_ptr = multiply;
    printf("  func_ptr 指向 multiply: 7 * 8 = %d\n", func_ptr(7, 8));

    // 指向 divide
    func_ptr = divide;
    printf("  func_ptr 指向 divide: 100 / 7 = %d\n", func_ptr(100, 7));
    printf("\n");

    // =========================================================
    // 第二部分: 函数指针作为参数（回调函数）
    // =========================================================
    printf("========================================\n");
    printf("  第二部分: 函数指针作为参数 —— 回调\n");
    printf("========================================\n\n");

    // ---------------------------------------------------------
    // 示例 3: 回调函数 —— 把函数作为参数传给另一个函数
    // ---------------------------------------------------------
    printf("【示例 3】回调函数 —— 通用计算器\n");

    // calculate 函数接收一个函数指针作为参数
    // 调用 calculate 时传入具体的运算函数

    printf("  使用 add 回调:     10 + 5 = %d\n", calculate(10, 5, add));
    printf("  使用 subtract 回调: 10 - 5 = %d\n", calculate(10, 5, subtract));
    printf("  使用 multiply 回调: 10 * 5 = %d\n", calculate(10, 5, multiply));
    printf("  使用 divide 回调:   10 / 5 = %d\n", calculate(10, 5, divide));
    printf("\n");

    // ---------------------------------------------------------
    // 示例 4: 利用回调实现通用的排序函数
    // ---------------------------------------------------------
    printf("【示例 4】使用回调实现通用排序\n");

    int numbers[] = {34, 12, 56, 78, 23, 9, 45, 67};
    int size = sizeof(numbers) / sizeof(numbers[0]);

    printf("  原始数组: ");
    for (int i = 0; i < size; i++) {
        printf("%d ", numbers[i]);
    }
    printf("\n");

    // 升序排序（传入 ascending 比较函数）
    bubble_sort(numbers, size, ascending);
    printf("  升序排列: ");
    for (int i = 0; i < size; i++) {
        printf("%d ", numbers[i]);
    }
    printf("\n");

    // 降序排序（传入 descending 比较函数）
    bubble_sort(numbers, size, descending);
    printf("  降序排列: ");
    for (int i = 0; i < size; i++) {
        printf("%d ", numbers[i]);
    }
    printf("\n\n");

    // =========================================================
    // 第三部分: 函数指针数组
    // =========================================================
    printf("========================================\n");
    printf("  第三部分: 函数指针数组\n");
    printf("========================================\n\n");

    // ---------------------------------------------------------
    // 示例 5: 函数指针数组 —— 实现计算器菜单
    // ---------------------------------------------------------
    printf("【示例 5】函数指针数组 —— 计算器菜单\n");

    // 声明一个函数指针数组，包含 5 个元素
    // 每个元素都是"返回 int、接受两个 int 参数"的函数指针
    // int (*operations[])(int, int) = {add, subtract, multiply, divide, modulo};
    // 或者使用前面定义的 typedef:
    math_func operations[5] = {add, subtract, multiply, divide, modulo};

    // 运算名称数组
    const char* op_names[] = {"加法", "减法", "乘法", "除法", "取模"};

    int a = 20, b = 7;

    printf("  使用函数指针数组进行计算:\n");
    for (int i = 0; i < 5; i++) {
        // 通过数组下标选择要调用的函数
        int res = operations[i](a, b);
        printf("  [%d] %s: %d %s %d = %d\n",
               i, op_names[i], a,
               (i == 0) ? "+" : (i == 1) ? "-" : (i == 2) ? "*" : (i == 3) ? "/" : "%",
               b, res);
    }
    printf("\n");

    // ---------------------------------------------------------
    // 示例 6: 函数指针数组实现状态机（简化演示）
    // ---------------------------------------------------------
    printf("【示例 6】函数指针数组的灵活使用\n");

    // 根据用户选择动态调用不同的函数（模拟菜单驱动）
    int choice = 2;  // 假设用户选择了第 2 项（乘法）

    printf("  用户选择操作 [%d]: %s\n", choice, op_names[choice]);
    printf("  结果: %d\n", operations[choice](15, 6));
    printf("\n");

    // =========================================================
    // 第四部分: 高级用法
    // =========================================================
    printf("========================================\n");
    printf("  第四部分: 函数指针的进阶话题\n");
    printf("========================================\n\n");

    // ---------------------------------------------------------
    // 示例 7: 返回函数指针的函数（简化和对比）
    // ---------------------------------------------------------
    printf("【示例 7】函数指针的 typedef 简化\n");

    // 使用 typedef 定义函数指针类型：
    // typedef int (*math_func)(int, int);
    // 上面已经在文件顶部定义了

    // 使用 typedef 后的效果：
    // 不用每次都写 int (*ptr)(int, int)
    // 直接写 math_func ptr;

    math_func ptr1 = add;      // 简化的函数指针声明
    math_func ptr2 = multiply; // 多个函数指针变量

    printf("  math_func ptr1 指向 add:     %d\n", ptr1(3, 4));
    printf("  math_func ptr2 指向 multiply: %d\n", ptr2(3, 4));

    // 函数指针数组也可以简化
    math_func ops[3] = {add, subtract, multiply};
    printf("  ops[0](10, 5) = %d\n", ops[0](10, 5));
    printf("  ops[1](10, 5) = %d\n", ops[1](10, 5));
    printf("  ops[2](10, 5) = %d\n", ops[2](10, 5));
    printf("\n");

    // ---------------------------------------------------------
    // 总结
    // ---------------------------------------------------------
    printf("========================================\n");
    printf("  函数指针要点总结:\n\n");
    printf("  声明语法:\n");
    printf("    返回类型 (*指针名)(参数类型列表)\n\n");
    printf("  关键用法:\n");
    printf("    1. 函数名就是函数地址（类似数组名）\n");
    printf("    2. func_ptr(args) 或 (*func_ptr)(args) 两种调用方式\n");
    printf("    3. 作为回调参数实现策略模式\n");
    printf("    4. 函数指针数组实现菜单驱动的状态机\n");
    printf("    5. typedef 可以简化复杂的函数指针声明\n\n");
    printf("  应用场景:\n");
    printf("    回调函数、策略模式、状态机、事件驱动、插件架构\n");
    printf("========================================\n");

    return 0;
}

// =============================================================
// 函数实现
// =============================================================

/**
 * add - 加法
 */
int add(int a, int b)
{
    return a + b;
}

/**
 * subtract - 减法
 */
int subtract(int a, int b)
{
    return a - b;
}

/**
 * multiply - 乘法
 */
int multiply(int a, int b)
{
    return a * b;
}

/**
 * divide - 除法
 */
int divide(int a, int b)
{
    if (b == 0) {
        printf("  错误：除数不能为 0！\n");
        return 0;
    }
    return a / b;
}

/**
 * modulo - 取模
 */
int modulo(int a, int b)
{
    if (b == 0) {
        printf("  错误：模数不能为 0！\n");
        return 0;
    }
    return a % b;
}

/**
 * calculate - 通用计算函数
 * @x: 第一个操作数
 * @y: 第二个操作数
 * @operation: 指向运算函数的指针（回调函数）
 *
 * 接受一个函数指针作为参数，实现了"策略模式"。
 * 调用者可以传入不同的运算函数，实现不同的计算行为。
 *
 * 返回: 运算结果
 */
int calculate(int x, int y, int (*operation)(int, int))
{
    // 通过函数指针调用传入的函数
    return operation(x, y);
}

/**
 * ascending - 升序比较函数
 * @a: 第一个值
 * @b: 第二个值
 *
 * 返回: 如果 a < b 返回正数（交换），否则返回 0 或负数
 * 这是冒泡排序中使用的比较回调
 */
int ascending(int a, int b)
{
    return a - b;  // 正数表示 a > b，需要交换
}

/**
 * descending - 降序比较函数
 * @a: 第一个值
 * @b: 第二个值
 *
 * 返回: 如果 a < b 返回负数（交换），否则返回 0 或正数
 */
int descending(int a, int b)
{
    return b - a;  // 正数表示 b > a，需要交换
}

/**
 * bubble_sort - 通用冒泡排序（使用回调函数决定排序顺序）
 * @arr: 待排序数组
 * @size: 数组长度
 * @compare: 比较函数的指针
 *
 * 通过传入不同的比较函数，可以实现升序或降序排序。
 * 这是"策略模式"的一个经典例子。
 */
void bubble_sort(int arr[], int size, int (*compare)(int, int))
{
    for (int i = 0; i < size - 1; i++) {
        for (int j = 0; j < size - i - 1; j++) {
            // 使用比较回调函数决定是否交换
            if (compare(arr[j], arr[j + 1]) > 0) {
                // 交换 arr[j] 和 arr[j+1]
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}
