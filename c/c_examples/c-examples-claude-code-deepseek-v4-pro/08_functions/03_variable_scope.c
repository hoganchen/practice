/*
 * ============================================
 * 知识点：变量作用域和生命周期
 * 说明：
 *   变量的作用域决定了变量在程序的哪些部分
 *   可以被访问。生命周期决定了变量何时创建和销毁。
 *
 * 变量的分类：
 *   1. 局部变量 — 在函数/代码块内定义
 *   2. 全局变量 — 在所有函数之外定义
 *   3. 静态变量 — 用 static 修饰
 *   4. 寄存器变量 — 用 register 修饰（建议性）
 *
 * 存储类别：
 *   auto    — 自动存储（默认）
 *   static  — 静态存储
 *   extern  — 外部链接（引用其他文件中定义的变量）
 *   register — 建议存储在寄存器中
 *
 * 编译方法：
 *   gcc 03_variable_scope.c -o 03_variable_scope
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"

// ========== 全局变量 ==========
/*
 * 在所有函数之外定义的变量是全局变量。
 * 作用域：从定义位置到文件末尾。
 * 生命周期：程序开始到结束。
 * 自动初始化为 0。
 */
int global_count = 10;       // 全局变量，在整个文件中可见
static int file_static = 5;  // 文件静态变量，只在本文件中可见

// ========== 函数定义 ==========

void demonstrate_local(void) {
    // ========== 局部变量 ==========
    /*
     * 在函数或代码块内部定义的变量。
     * 作用域：仅限于所在的代码块（{} 内）。
     * 生命周期：进入代码块创建，退出销毁。
     * 不会自动初始化（内容不确定！）。
     */
    int local_var = 100;     // 局部变量
    auto int auto_var = 200; // auto 可省略，默认就是 auto

    printf("  局部变量 local_var = %d\n", local_var);
    printf("  自动变量 auto_var = %d\n", auto_var);
    printf("  全局变量 global_count = %d\n", global_count);
}

void demonstrate_static(void) {
    /*
     * 静态局部变量：
     * - 用 static 修饰的局部变量
     * - 生命周期：程序开始到结束
     * - 作用域：仅限于所在函数
     * - 只初始化一次，多次调用保持值不变
     * - 自动初始化为 0
     */
    static int call_count = 0;  // 静态局部变量
    int normal_var = 0;         // 普通局部变量

    call_count++;
    normal_var++;

    printf("  第 %d 次调用\n", call_count);
    printf("    静态变量 call_count = %d (持续累加)\n", call_count);
    printf("    普通变量 normal_var = %d (每次重置)\n", normal_var);
}

// ========== 代码块作用域 ==========
void demonstrate_block_scope(void) {
    int outer = 10;

    printf("外层变量: %d\n", outer);

    {
        // 在代码块中定义变量
        int inner = 20;
        printf("  内层变量: %d\n", inner);
        printf("  内层访问外层: %d\n", outer);

        // 可以定义同名变量遮蔽（shadow）外层变量
        int outer = 30;  // 遮蔽（shadow）外层的 outer
        printf("  内层同名的 outer: %d\n", outer);
    }

    // printf("inner = %d", inner);  // 错误！inner 已销毁
    printf("外层 outer 不变: %d\n", outer);  // 仍然是 10
}

// ========== 使用 extern 声明外部变量 ==========
extern int external_var;  // 声明变量在其他文件中定义
// 如果没有其他文件定义 external_var，链接会报错
// 这里先注释掉，避免链接错误
// 实际使用时：在一个 .c 文件中定义，在另一个文件中用 extern 声明

// ========== 寄存器变量（建议性） ==========
int compute_sum(int n) {
    /*
     * register 建议编译器将变量存储在CPU寄存器中
     * 以加速访问。但编译器可能忽略这个建议。
     * 不能对寄存器变量取地址。
     */
    register int sum = 0;

    for (register int i = 1; i <= n; i++) {
        sum += i;
    }

    // printf("%p", &sum);  // 错误！不能对 register 变量取地址
    return sum;
}

// ========== main 函数 ==========
int main() {
    printf("===== 变量作用域和生命周期 =====\n\n");

    // ========== 全局变量 ==========
    printf("--- 全局变量 ---\n");
    printf("全局变量 global_count = %d\n", global_count);
    printf("文件静态变量 file_static = %d\n\n", file_static);

    // ========== 局部变量 ==========
    printf("--- 局部变量 ---\n");
    demonstrate_local();
    // printf("local_var = %d", local_var); // 错误！不在作用域内
    printf("\n");

    // ========== 静态变量 ==========
    printf("--- 静态局部变量 ---\n");
    printf("第一次调用:\n");
    demonstrate_static();
    printf("第二次调用:\n");
    demonstrate_static();
    printf("第三次调用:\n");
    demonstrate_static();
    printf("\n");

    // ========== 代码块作用域 ==========
    printf("--- 代码块作用域 ---\n");
    demonstrate_block_scope();
    printf("\n");

    // ========== 寄存器变量 ==========
    printf("--- 寄存器变量 ---\n");
    int result = compute_sum(100);
    printf("1 到 100 的和 = %d\n", result);
    printf("\n");

    // ========== 变量遮蔽的警告 ==========
    printf("--- 变量遮蔽（shadowing）---\n");
    int x = 5;

    {
        int x = 10;  // 遮蔽外层的 x
        printf("内层 x = %d\n", x);
    }

    printf("外层 x = %d (不受影响)\n", x);

    // ========== 作用域总结 ==========
    printf("\n===== 作用域总结 =====\n");
    printf("变量类型    | 作用域       | 生命周期     | 初始化\n");
    printf("------------|-------------|-------------|-------\n");
    printf("局部变量    | 所在代码块   | 进入/退出块  | 不确定\n");
    printf("静态局部变量 | 所在函数     | 程序全程    | 0\n");
    printf("全局变量    | 整个文件     | 程序全程    | 0\n");
    printf("静态全局变量 | 本文件       | 程序全程    | 0\n");
    printf("寄存器变量  | 所在代码块   | 进入/退出块  | 不确定\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. 局部变量在 {} 内定义，退出后销毁
 * 2. 局部变量不会自动初始化
 * 3. 静态变量只初始化一次，多次调用保持值
 * 4. 全局变量在整个文件中可见
 * 5. static 修饰全局变量限制在本文件使用
 * 6. 避免过度使用全局变量和变量遮蔽
 * ============================================
 */
