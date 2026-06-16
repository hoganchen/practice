/*
 * ============================================
 * 知识点：递归函数
 * 说明：
 *   递归是指函数调用自身的编程技巧。
 *   递归包含两个要素：
 *   1. 递归条件 — 函数调用自身
 *   2. 终止条件 — 停止递归的条件（基本情况）
 *
 *   递归 vs 迭代：
 *   递归代码更简洁，但可能更深导致栈溢出
 *   迭代效率更高，但代码可能更复杂
 *
 * 编译方法：
 *   gcc 04_recursion.c -o 04_recursion
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"

// ========== 1. 阶乘（经典递归）==========
/*
 * n! = n * (n-1) * (n-2) * ... * 1
 * 递归定义：
 *   0! = 1          （终止条件）
 *   n! = n * (n-1)!  （递归条件）
 */
unsigned long long factorial(int n) {
    printf("  计算 factorial(%d)\n", n);

    // 终止条件：0! = 1
    if (n <= 1) {
        printf("  返回 1\n");
        return 1;
    }

    // 递归条件：n! = n * (n-1)!
    unsigned long long result = n * factorial(n - 1);
    printf("  factorial(%d) = %llu\n", n, result);
    return result;
}

// ========== 2. 斐波那契数列 ==========
/*
 * F(0) = 0, F(1) = 1         （终止条件）
 * F(n) = F(n-1) + F(n-2)      （递归条件）
 *
 * 注意：这种朴素递归实现效率很低，
 * 因为有大量重复计算。
 */
unsigned long long fib_naive(int n) {
    if (n <= 0) return 0;
    if (n == 1) return 1;
    // 重复计算！fib_naive(n-1) 和 fib_naive(n-2) 有重叠
    return fib_naive(n - 1) + fib_naive(n - 2);
}

// 优化：记忆化递归（动态规划）
unsigned long long fib_memo(int n, unsigned long long memo[]) {
    if (n <= 0) return 0;
    if (n == 1) return 1;

    // 如果已经计算过，直接返回
    if (memo[n] != 0) return memo[n];

    // 计算并缓存结果
    memo[n] = fib_memo(n - 1, memo) + fib_memo(n - 2, memo);
    return memo[n];
}

unsigned long long fib_optimized(int n) {
    unsigned long long memo[100] = {0};  // 缓存数组
    return fib_memo(n, memo);
}

// ========== 3. 汉诺塔 ==========
/*
 * 汉诺塔：将 n 个盘子从 A 移到 C，中间借助 B
 * 规则：
 *   1. 每次只能移动一个盘子
 *   2. 大盘子不能放在小盘子上面
 */
void hanoi(int n, char from, char to, char aux) {
    if (n == 1) {
        printf("  移动盘子 1: %c -> %c\n", from, to);
        return;
    }

    // 将 n-1 个盘子从 from 移到 aux（借助 to）
    hanoi(n - 1, from, aux, to);
    // 移动最下面的盘子
    printf("  移动盘子 %d: %c -> %c\n", n, from, to);
    // 将 n-1 个盘子从 aux 移到 to（借助 from）
    hanoi(n - 1, aux, to, from);
}

// ========== 4. 递归遍历数组（求和）==========
int sum_recursive(const int arr[], int n) {
    // 终止条件：空数组和为0
    if (n <= 0) return 0;
    // 当前元素 + 剩余元素的和
    return arr[0] + sum_recursive(arr + 1, n - 1);
    // arr + 1 是数组指针后移一位
    // n - 1 是剩余元素个数
}

// ========== 5. 二分查找（递归版本）==========
/*
 * 在已排序的数组中查找目标值
 * 返回元素的索引，没找到返回 -1
 */
int binary_search_recursive(const int arr[], int left, int right, int target) {
    // 终止条件：搜索范围为空
    if (left > right) {
        return -1;  // 没找到
    }

    int mid = left + (right - left) / 2;  // 中间索引（避免溢出）

    if (arr[mid] == target) {
        return mid;  // 找到目标
    } else if (arr[mid] < target) {
        // 目标在右半部分
        return binary_search_recursive(arr, mid + 1, right, target);
    } else {
        // 目标在左半部分
        return binary_search_recursive(arr, left, mid - 1, target);
    }
}

// ========== 6. 间接递归 ==========
/*
 * 两个函数互相调用（需要先声明原型）
 */
void function_a(int n);
void function_b(int n);

void function_a(int n) {
    if (n > 0) {
        printf("A(%d) ", n);
        function_b(n - 1);  // 调用 B
    }
}

void function_b(int n) {
    if (n > 0) {
        printf("B(%d) ", n);
        function_a(n / 2);  // 调用 A
    }
}

// ========== main ==========
int main() {
    printf("===== 递归函数 =====\n\n");

    // ========== 阶乘 ==========
    printf("--- 1. 阶乘 ---\n");
    int n = 5;
    printf("factorial(%d) = %llu\n\n", n, factorial(n));

    // ========== 斐波那契 ==========
    printf("\n--- 2. 斐波那契数列 ---\n");
    printf("朴素递归 fib(10) = %llu\n", fib_naive(10));
    printf("记忆化递归 fib(10) = %llu\n", fib_optimized(10));
    printf("记忆化递归 fib(50) = %llu\n", fib_optimized(50));

    // 比较效率（计算 fib(40)，可能会慢）
    printf("\n计算 fib(40) 的对比...\n");
    printf("记忆化版本（几乎瞬间）: %llu\n", fib_optimized(40));
    // 朴素版本会很慢，注释掉避免等待
    // printf("朴素版本（会很久）: %llu\n", fib_naive(40));

    // ========== 汉诺塔 ==========
    printf("\n--- 3. 汉诺塔 (3个盘子) ---\n");
    hanoi(3, 'A', 'C', 'B');
    printf("共需 2^3 - 1 = 7 步\n");

    // ========== 数组求和 ==========
    printf("\n--- 4. 递归数组求和 ---\n");
    int arr[] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    int size = sizeof(arr) / sizeof(arr[0]);
    printf("数组和为: %d\n", sum_recursive(arr, size));

    // ========== 二分查找 ==========
    printf("\n--- 5. 二分查找（递归） ---\n");
    int sorted[] = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
    int s_size = sizeof(sorted) / sizeof(sorted[0]);
    int target = 23;

    int idx = binary_search_recursive(sorted, 0, s_size - 1, target);
    if (idx >= 0) {
        printf("找到 %d 在索引 %d\n", target, idx);
    } else {
        printf("没找到 %d\n", target);
    }

    // 没找到的情况
    target = 100;
    idx = binary_search_recursive(sorted, 0, s_size - 1, target);
    printf("查找 %d 的结果: %s\n", target, idx >= 0 ? "找到" : "没找到");

    // ========== 间接递归 ==========
    printf("\n--- 6. 间接递归 ---\n");
    function_a(10);
    printf("\n");

    // ========== 递归总结 ==========
    printf("\n===== 递归注意事项 =====\n");
    printf("1. 必须有终止条件，否则无限递归（栈溢出）\n");
    printf("2. 每次递归调用都会消耗栈空间\n");
    printf("3. 递归深度过大会导致栈溢出\n");
    printf("4. 某些问题递归比迭代更直观\n");
    printf("5. 尾递归可以被编译器优化为循环\n");
    printf("6. 存在重复计算问题时考虑记忆化\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. 递归三要素：终止条件 + 递归调用 + 问题规模缩小
 * 2. 每次调用都在栈上分配空间
 * 3. 递归深度超过栈限制会崩溃
 * 4. 记忆化可以优化重复计算
 * 5. 间接递归需要提前声明函数原型
 * ============================================
 */
