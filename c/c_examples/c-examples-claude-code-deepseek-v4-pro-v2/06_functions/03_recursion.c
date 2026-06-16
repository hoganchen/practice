/**
 * ============================================================
 * 知识点: 递归 (Recursion)
 * ============================================================
 *
 * 【编译指令】
 *   gcc 03_recursion.c -o 03_recursion.exe -std=c11 -Wall
 *
 * 【运行指令】
 *   ./03_recursion.exe
 *
 * 【知识点概述】
 *   递归是一种函数调用自身的编程技巧。包含两个关键部分：
 *     - 基准情况（base case）：递归终止条件，不再调用自身
 *     - 递归情况（recursive case）：函数调用自身，问题规模缩小
 *   经典示例：阶乘计算、斐波那契数列、汉诺塔、目录遍历等
 *   注意：递归深度过大可能导致栈溢出（stack overflow）。
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>

// =============================================================
// 函数声明
// =============================================================

/*
 * 计算 n 的阶乘（递归实现）
 * 阶乘定义: n! = n * (n-1) * (n-2) * ... * 1
 * 基准情况: 0! = 1
 * 递归关系: n! = n * (n-1)!
 */
int factorial_recursive(int n);

/*
 * 计算 n 的阶乘（迭代实现，用于对比）
 */
int factorial_iterative(int n);

/*
 * 计算斐波那契数列的第 n 项（递归实现）
 * 斐波那契定义: fib(0) = 0, fib(1) = 1
 *              fib(n) = fib(n-1) + fib(n-2)  (n >= 2)
 */
int fibonacci_recursive(int n);

/*
 * 计算斐波那契数列的第 n 项（迭代实现，效率更高）
 */
int fibonacci_iterative(int n);

/*
 * 使用递归计算幂运算: base^exp
 * 基准情况: 任何数的 0 次幂 = 1
 * 递归关系: base^exp = base * base^(exp-1)
 */
int power_recursive(int base, int exp);

/*
 * 使用递归计算两个正整数的最大公约数（欧几里得算法）
 * 基准情况: gcd(a, 0) = a
 * 递归关系: gcd(a, b) = gcd(b, a % b)
 */
int gcd_recursive(int a, int b);

/*
 * 汉诺塔问题的递归解法
 * 将 n 个盘子从源柱移到目标柱，借助辅助柱
 */
void hanoi_tower(int n, char from, char to, char aux);

/*
 * 递归深度计数器（用于演示栈溢出风险）
 */
void deep_recursion(int depth, int limit);

/**
 * 主函数
 */
int main(void)
{
    printf("========================================\n");
    printf("  递归 (Recursion) 示例\n");
    printf("========================================\n\n");

    // ---------------------------------------------------------
    // 示例 1: 阶乘 —— 递归 vs 迭代
    // ---------------------------------------------------------
    printf("【示例 1】阶乘计算 —— 递归 vs 迭代\n");

    int n_fact = 6;

    // 递归方式
    int result_rec = factorial_recursive(n_fact);
    printf("  递归计算: %d! = %d\n", n_fact, result_rec);

    // 迭代方式（对比）
    int result_iter = factorial_iterative(n_fact);
    printf("  迭代计算: %d! = %d\n", n_fact, result_iter);

    // 验证结果一致
    printf("  两者结果%s\n\n", result_rec == result_iter ? "相同" : "不同");

    // ---------------------------------------------------------
    // 示例 2: 递归执行过程详解 —— 以 factorial(4) 为例
    // ---------------------------------------------------------
    printf("【示例 2】递归执行过程跟踪\n");
    printf("  factorial(4) 的调用过程:\n");
    printf("\n");
    printf("  调用链（递推阶段）:\n");
    printf("    factorial(4) = 4 * factorial(3)\n");
    printf("                 = 4 * (3 * factorial(2))\n");
    printf("                 = 4 * (3 * (2 * factorial(1)))\n");
    printf("                 = 4 * (3 * (2 * (1 * factorial(0))))\n");
    printf("                 = 4 * (3 * (2 * (1 * 1)))  <- 到达基准情况\n");
    printf("\n");
    printf("  返回链（回归阶段）:\n");
    printf("    factorial(0) = 1\n");
    printf("    factorial(1) = 1 * 1 = 1\n");
    printf("    factorial(2) = 2 * 1 = 2\n");
    printf("    factorial(3) = 3 * 2 = 6\n");
    printf("    factorial(4) = 4 * 6 = 24\n");
    printf("\n");

    // ---------------------------------------------------------
    // 示例 3: 斐波那契数列 —— 递归的优缺点
    // ---------------------------------------------------------
    printf("【示例 3】斐波那契数列\n");

    int fib_n = 10;

    printf("  第 %d 个斐波那契数（递归）: %d\n",
           fib_n, fibonacci_recursive(fib_n));
    printf("  第 %d 个斐波那契数（迭代）: %d\n",
           fib_n, fibonacci_iterative(fib_n));

    // 展示斐波那契数列的前几项
    printf("  斐波那契数列前 10 项: ");
    for (int i = 0; i < 10; i++) {
        printf("%d ", fibonacci_iterative(i + 1));
    }
    printf("\n\n");

    // ---------------------------------------------------------
    // 示例 4: 递归的效率问题 —— 重复计算
    // ---------------------------------------------------------
    printf("【示例 4】斐波那契递归的效率问题\n");

    printf("  递归求 fib(35)...\n");
    // 注意：fib(35) 的递归实现会进行大量的重复计算
    // fib(40) 就需要数千万次函数调用
    int fib35 = fibonacci_recursive(35);
    printf("  fib(35) = %d\n", fib35);
    printf("  递归调用了非常多次（指数级增长）\n");
    printf("  迭代实现: O(n)，递归实现: O(2^n)\n\n");

    // ---------------------------------------------------------
    // 示例 5: 幂运算的递归实现
    // ---------------------------------------------------------
    printf("【示例 5】幂运算的递归实现\n");

    int base = 2, exp = 10;
    int pow_result = power_recursive(base, exp);
    printf("  %d^%d = %d\n\n", base, exp, pow_result);

    // ---------------------------------------------------------
    // 示例 6: 最大公约数 —— 欧几里得算法
    // ---------------------------------------------------------
    printf("【示例 6】最大公约数（欧几里得算法）\n");

    int num1 = 48, num2 = 36;
    int gcd_result = gcd_recursive(num1, num2);
    printf("  gcd(%d, %d) = %d\n\n", num1, num2, gcd_result);

    // ---------------------------------------------------------
    // 示例 7: 汉诺塔问题
    // ---------------------------------------------------------
    printf("【示例 7】汉诺塔问题（3 个盘子）\n");
    printf("  移动步骤:\n");

    hanoi_tower(3, 'A', 'C', 'B');

    printf("  总移动次数: %d 次（即 2^3 - 1）\n\n", (1 << 3) - 1);

    // ---------------------------------------------------------
    // 示例 8: 递归深度与栈溢出风险
    // ---------------------------------------------------------
    printf("【示例 8】递归深度与栈溢出风险\n");

    printf("  默认情况下，函数调用栈大小有限（通常 1-8 MB）\n");
    printf("  每次递归调用都会在栈上分配栈帧（存储参数、局部变量、返回地址）\n");
    printf("  递归深度过大 => 栈溢出（Stack Overflow）\n\n");

    // 演示安全的递归深度
    printf("  尝试安全深度的递归（深度 10）:\n");
    deep_recursion(1, 10);
    printf("\n");

    // 警告：不要尝试深度递归！会导致程序崩溃
    printf("  【警告】不要使用过大的递归深度！\n");
    printf("  例如 deep_recursion(1, 100000) 会导致栈溢出（Segmentation Fault）\n");
    printf("\n");

    // ---------------------------------------------------------
    // 递归与迭代的对比总结
    // ---------------------------------------------------------
    printf("========================================\n");
    printf("  递归 vs 迭代 对比总结:\n\n");
    printf("  【递归的优点】\n");
    printf("  1. 代码简洁，逻辑清晰\n");
    printf("  2. 适合树形结构、分治算法\n");
    printf("  3. 天然适合某些数学定义\n\n");
    printf("  【递归的缺点】\n");
    printf("  1. 效率低（函数调用开销）\n");
    printf("  2. 可能导致重复计算\n");
    printf("  3. 深度限制（栈溢出风险）\n\n");
    printf("  【使用递归的原则】\n");
    printf("  1. 必须有基准情况（终止条件）\n");
    printf("  2. 每次递归调用的规模必须减小\n");
    printf("  3. 深度可控时使用递归，否则用迭代\n");
    printf("========================================\n");

    return 0;
}

// =============================================================
// 函数实现
// =============================================================

/**
 * factorial_recursive - 递归计算阶乘
 * @n: 非负整数
 *
 * 返回: n 的阶乘值
 *
 * 执行过程：
 *   factorial_recursive(4)
 *   -> 4 * factorial_recursive(3)
 *   -> 4 * 3 * factorial_recursive(2)
 *   -> 4 * 3 * 2 * factorial_recursive(1)
 *   -> 4 * 3 * 2 * 1 * factorial_recursive(0)
 *   -> 4 * 3 * 2 * 1 * 1 = 24
 */
int factorial_recursive(int n)
{
    // 基准情况（base case）：0! = 1
    // 这是递归停止的条件，非常重要！
    if (n <= 1) {
        return 1;
    }

    // 递归情况（recursive case）：n! = n * (n-1)!
    // 函数调用自身，但参数从 n 减小到 n-1
    return n * factorial_recursive(n - 1);
}

/**
 * factorial_iterative - 迭代计算阶乘（对比用）
 * @n: 非负整数
 * 返回: n 的阶乘值
 */
int factorial_iterative(int n)
{
    int result = 1;

    for (int i = 2; i <= n; i++) {
        result *= i;
    }

    return result;
}

/**
 * fibonacci_recursive - 递归计算斐波那契数
 * @n: 第 n 项（n >= 0）
 *
 * 返回: 斐波那契数列的第 n 项
 *
 * 注意：这个实现效率极低，因为大量重复计算！
 * 计算 fib(40) 需要约 3.3 亿次函数调用。
 */
int fibonacci_recursive(int n)
{
    // 基准情况 1: fib(1) = 1
    // 基准情况 2: fib(2) = 1
    if (n <= 2) {
        return 1;
    }

    // 递归情况: fib(n) = fib(n-1) + fib(n-2)
    // 注意：这里有两个递归调用，导致 O(2^n) 的时间复杂度
    return fibonacci_recursive(n - 1) + fibonacci_recursive(n - 2);
}

/**
 * fibonacci_iterative - 迭代计算斐波那契数（高效的对比实现）
 * @n: 第 n 项
 * 返回: 斐波那契数列的第 n 项
 */
int fibonacci_iterative(int n)
{
    if (n <= 2) {
        return 1;
    }

    int prev1 = 1;  // fib(1)
    int prev2 = 1;  // fib(2)
    int current;

    for (int i = 3; i <= n; i++) {
        current = prev1 + prev2;  // fib(n) = fib(n-1) + fib(n-2)
        prev1 = prev2;
        prev2 = current;
    }

    return current;
}

/**
 * power_recursive - 递归计算幂运算
 * @base: 底数
 * @exp: 指数（非负整数）
 *
 * 返回: base^exp
 */
int power_recursive(int base, int exp)
{
    // 基准情况：任何数的 0 次幂为 1
    if (exp == 0) {
        return 1;
    }

    // 递归情况：base^exp = base * base^(exp-1)
    return base * power_recursive(base, exp - 1);
}

/**
 * gcd_recursive - 递归计算最大公约数（欧几里得算法）
 * @a: 正整数
 * @b: 正整数
 *
 * 返回: a 和 b 的最大公约数
 *
 * 欧几里得算法原理：
 *   gcd(a, b) = gcd(b, a % b)
 *   当 b = 0 时，gcd(a, 0) = a
 */
int gcd_recursive(int a, int b)
{
    // 基准情况：当 b 为 0 时，a 就是最大公约数
    if (b == 0) {
        return a;
    }

    // 递归情况：gcd(a, b) = gcd(b, a % b)
    return gcd_recursive(b, a % b);
}

/**
 * hanoi_tower - 汉诺塔问题的递归解
 * @n: 盘子数量
 * @from: 源柱名称
 * @to: 目标柱名称
 * @aux: 辅助柱名称
 *
 * 汉诺塔问题描述：
 *   有三根柱子，第一根上有 n 个大小不同的盘子（大在下小在上）。
 *   目标：将所有盘子移动到第三根柱子上。
 *   规则：每次只能移动一个盘子，大盘子不能放在小盘子上面。
 *
 * 递归思路：
 *   1. 将上面 n-1 个盘子从 from 移到 aux（借助 to）
 *   2. 将最大的盘子从 from 移到 to
 *   3. 将 n-1 个盘子从 aux 移到 to（借助 from）
 */
void hanoi_tower(int n, char from, char to, char aux)
{
    // 基准情况：只有一个盘子，直接移动
    if (n == 1) {
        printf("    移动盘子 1: %c -> %c\n", from, to);
        return;
    }

    // 递归情况：
    // 1. 将上面的 n-1 个盘子从 from 移到 aux
    hanoi_tower(n - 1, from, aux, to);

    // 2. 移动最大的盘子
    printf("    移动盘子 %d: %c -> %c\n", n, from, to);

    // 3. 将 n-1 个盘子从 aux 移到 to
    hanoi_tower(n - 1, aux, to, from);
}

/**
 * deep_recursion - 递归深度演示
 * @depth: 当前深度
 * @limit: 最大深度
 */
void deep_recursion(int depth, int limit)
{
    // 基准情况：达到限制深度
    if (depth > limit) {
        return;
    }

    // 打印当前深度和局部变量的地址（展示栈帧位置）
    int local_var = depth;
    printf("  深度 %2d: 栈帧地址 %p\n", depth, (void*)&local_var);

    // 递归调用（深度增加）
    deep_recursion(depth + 1, limit);
}
