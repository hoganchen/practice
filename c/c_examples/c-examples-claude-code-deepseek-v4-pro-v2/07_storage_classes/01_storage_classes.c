/**
 * ============================================================
 * 知识点: 存储类 (Storage Classes)
 * ============================================================
 *
 * 【编译指令】
 *   gcc 01_storage_classes.c -o 01_storage_classes.exe -std=c11 -Wall
 *
 * 【运行指令】
 *   ./01_storage_classes.exe
 *
 * 【知识点概述】
 *   C 语言的存储类决定了变量的作用域（scope）和生命周期（lifetime）：
 *
 *   auto    —— 自动存储期（默认），局部作用域
 *   register —— 建议编译器将变量存储在寄存器中（优化提示）
 *   static  —— 静态存储期 + 内部链接（文件内全局）
 *   extern  —— 外部链接（跨文件访问）
 *
 *   关键概念：
 *     - 作用域（scope）:    变量在何处可见（代码块、文件、程序）
 *     - 生命周期（lifetime）:变量在何时存在（栈、静态区）
 *     - 链接属性（linkage）: 变量在多个文件中如何关联
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>

// =============================================================
// 全局变量（默认具有外部链接）
// =============================================================

// 全局变量定义
// 作用域：整个文件（从定义处到文件末尾）
// 生命周期：程序启动到程序结束（静态存储期）
// 链接属性：外部链接（其他文件可以通过 extern 访问）
int global_counter = 0;  // 全局变量，默认初始化为 0

// 静态全局变量
// 作用域：整个文件
// 生命周期：程序启动到程序结束
// 链接属性：内部链接（仅限本文件访问，其他文件无法通过 extern 访问）
static int file_scope_counter = 0;

// =============================================================
// 函数声明
// =============================================================

/*
 * 演示 auto 存储类（局部变量）
 */
void demonstrate_auto(void);

/*
 * 演示 register 存储类
 */
void demonstrate_register(void);

/*
 * 演示静态局部变量（保留上一次的值）
 * 该函数在每次调用时更新静态变量
 */
void demonstrate_static_local(void);

/*
 * 演示静态全局变量的使用（只能在当前文件访问）
 */
void increment_file_counter(void);
int get_file_counter(void);

/*
 * 演示 extern 的用法（引用外部全局变量）
 */
void demonstrate_extern(void);

/*
 * 演示局部变量和静态局部变量的区别
 */
void compare_local_vs_static(void);

/*
 * 演示使用静态变量实现函数调用计数器
 */
void function_with_counter(void);

// =============================================================
// 辅助函数：打印分隔线
// =============================================================
void print_separator(const char* title);

/**
 * 主函数
 */
int main(void)
{
    printf("========================================\n");
    printf("  存储类 (Storage Classes) 示例\n");
    printf("========================================\n\n");

    // =========================================================
    // 第一部分: auto 存储类
    // =========================================================
    print_separator("第一部分: auto 存储类");

    /*
     * auto 是局部变量的默认存储类。
     * 实际上很少显式写 auto，因为局部变量默认就是 auto。
     *
     * 特点：
     *   - 存储在栈上（stack）
     *   - 进入代码块时分配，退出时销毁
     *   - 不会自动初始化（值是垃圾值）
     *   - 仅在定义它的代码块中可见
     */
    demonstrate_auto();

    // =========================================================
    // 第二部分: register 存储类
    // =========================================================
    print_separator("第二部分: register 存储类");

    /*
     * register 只是一个"建议"，编译器可能忽略它。
     * 现代编译器优化很好，几乎不需要手动使用 register。
     *
     * 特点：
     *   - 建议编译器将变量放入 CPU 寄存器（访问更快）
     *   - 不能对 register 变量取地址（& 操作符）
     *   - 编译器可以忽略此建议
     */
    demonstrate_register();

    // =========================================================
    // 第三部分: static 存储类（局部静态变量）
    // =========================================================
    print_separator("第三部分: static 存储类（局部静态变量）");

    /*
     * static 局部变量：
     *   - 存储在静态数据区（不是栈上）
     *   - 程序启动时分配，程序结束时销毁
     *   - 自动初始化为 0（如果不显式初始化）
     *   - 只在定义它的函数内可见，但保留值
     */

    printf("  多次调用 demonstrate_static_local:\n");
    for (int i = 0; i < 5; i++) {
        printf("  调用 #%d: ", i + 1);
        demonstrate_static_local();
    }
    printf("\n");

    // 对比局部变量和静态局部变量
    compare_local_vs_static();

    // =========================================================
    // 第四部分: static 存储类（文件作用域静态变量）
    // =========================================================
    print_separator("第四部分: static 文件作用域变量");

    /*
     * static 文件作用域变量：
     *   - 内部链接（仅限当前文件访问）
     *   - 在文件顶部声明，在整个文件中可见
     *   - 生命周期 = 程序运行期间
     *   - 用于隐藏实现细节（信息隐藏）
     */

    printf("  文件作用域静态变量（仅在本文件内可见）:\n");
    for (int i = 0; i < 3; i++) {
        increment_file_counter();
        printf("  第 %d 次调用后: file_scope_counter = %d\n",
               i + 1, get_file_counter());
    }
    printf("\n");

    // =========================================================
    // 第五部分: extern 存储类
    // =========================================================
    print_separator("第五部分: extern 存储类");

    /*
     * extern 声明变量或函数是在其他文件中定义的。
     * 它告诉编译器："这个变量/函数在其他地方定义，让我在这里使用它。"
     *
     * extern 不分配存储空间，只是声明。
     * 真正的定义（分配空间）在另一个文件中。
     */

    demonstrate_extern();

    // =========================================================
    // 第六部分: 作用域 vs 生命周期 对比
    // =========================================================
    print_separator("第六部分: 作用域 vs 生命周期");

    printf("  存储类对比表:\n\n");
    printf("  ┌──────────┬────────────┬────────────┬──────────┐\n");
    printf("  │ 存储类   │ 作用域     │ 生命周期   │ 初始值   │\n");
    printf("  ├──────────┼────────────┼────────────┼──────────┤\n");
    printf("  │ auto     │ 代码块     │ 局部(栈)   │ 不定     │\n");
    printf("  │ register │ 代码块     │ 局部(寄存器│ 不定     │\n");
    printf("  │ static局 │ 代码块     │ 程序全程   │ 0        │\n");
    printf("  │ static全 │ 整个文件   │ 程序全程   │ 0        │\n");
    printf("  │ extern   │ 整个程序   │ 程序全程   │ 外部定义 │\n");
    printf("  └──────────┴────────────┴────────────┴──────────┘\n\n");

    // =========================================================
    // 第七部分: 综合示例 —— 静态计数器
    // =========================================================
    print_separator("第七部分: 综合示例 —— 函数调用计数器");

    printf("  使用静态变量实现函数调用计数:\n");
    for (int i = 0; i < 3; i++) {
        function_with_counter();
    }
    printf("\n");

    // =========================================================
    // 总结
    // =========================================================
    printf("========================================\n");
    printf("  存储类要点总结:\n\n");
    printf("  1. auto（默认）:\n");
    printf("     局部变量，栈上分配，作用域块内\n\n");
    printf("  2. register:\n");
    printf("     建议放入寄存器，不能取地址，可被忽略\n\n");
    printf("  3. static（局部）:\n");
    printf("     保持值不变，函数退出不销毁，自动初始化为 0\n\n");
    printf("  4. static（全局/文件域）:\n");
    printf("     内部链接，仅当前文件可见，信息隐藏\n\n");
    printf("  5. extern:\n");
    printf("     引用其他文件定义的全局变量/函数\n\n");
    printf("  关键区分: 作用域（在哪里可见）vs 生命周期（存在多久）\n");
    printf("========================================\n");

    return 0;
}

// =============================================================
// 函数实现
// =============================================================

/**
 * demonstrate_auto - 演示 auto 存储类
 *
 * auto 是局部变量的默认存储类，几乎从不明写。
 * 下面的代码块展示了嵌套作用域中的 auto 变量。
 */
void demonstrate_auto(void)
{
    printf("  【auto 存储类】\n");

    // 外层代码块
    int a = 10;  // 这是一个 auto 变量（默认就是 auto，很少显式写 auto）
    printf("  外层 a = %d\n", a);

    {
        // 内层代码块中的 auto 变量（与外层的 a 不同）
        int a = 20;  // 内层变量"遮蔽"了外层的 a
        printf("  内层 a = %d (遮蔽了外层的 a)\n", a);
    }  // 内层 a 在此销毁

    // 外层 a 仍然存在
    printf("  回到外层 a = %d\n", a);

    printf("  注意：auto 变量不会自动初始化，值是栈上的残留值\n\n");
}

/**
 * demonstrate_register - 演示 register 存储类
 *
 * register 关键字建议编译器将变量存储在 CPU 寄存器中。
 * 现代编译器通常可以自动做到最优的寄存器分配。
 */
void demonstrate_register(void)
{
    printf("  【register 存储类】\n");

    // register 只是"建议"，编译器可能忽略
    register int counter = 0;

    printf("  register int counter = %d\n", counter);
    printf("  register 只是对编译器的建议，现代编译器通常忽略它\n");
    printf("  不能对 register 变量使用 & 取地址（&counter 会编译错误）\n");
    printf("\n");

    // 实际使用 register 的场景很少，但在循环计数器中仍然有用
    printf("  在循环中使用 register:\n");
    register int i;
    for (i = 0; i < 5; i++) {
        printf("  i = %d\n", i);
    }
    printf("\n");
}

/**
 * demonstrate_static_local - 演示 static 局部变量
 *
 * static 局部变量在函数调用之间保持其值。
 * 每次调用时，变量不会重新初始化。
 */
void demonstrate_static_local(void)
{
    // 静态局部变量：
    // - 只初始化一次（程序启动时）
    // - 函数调用之间保持值
    // - 自动初始化为 0
    static int call_count = 0;  // 静态局部变量

    // 普通局部变量（对比）
    int local_count = 0;        // 每次调用都重新初始化

    call_count++;   // 每次调用递增
    local_count++;  // 每次都被重置为 0

    printf("  static 变量: %d, auto 变量: %d\n",
           call_count, local_count);
}

/**
 * compare_local_vs_static - 对比局部变量和静态局部变量
 */
void compare_local_vs_static(void)
{
    printf("  局部变量 vs 静态局部变量的关键区别:\n\n");

    {
        // 局部变量（auto）
        int local = 0;
        local++;
        printf("  auto 局部变量: local = %d (每次进入代码块都初始化)\n", local);
    }

    {
        static int static_var = 0;
        static_var++;
        printf("  static 局部变量: static_var = %d (只初始化一次，保持值)\n", static_var);
    }

    {
        static int static_var = 0;
        static_var++;
        printf("  再次进入相同代码块: static_var = %d (值持续递增)\n", static_var);
    }
    printf("\n");
}

/**
 * increment_file_counter - 递增文件作用域的静态变量
 *
 * 这个函数可以修改 file_scope_counter 的值。
 * 但由于 file_scope_counter 是 static 的，其他文件无法访问它。
 */
void increment_file_counter(void)
{
    file_scope_counter++;  // 直接修改 static 文件作用域变量
}

/**
 * get_file_counter - 获取文件作用域静态变量的值
 *
 * 通过函数提供对 static 变量的访问接口（类似 getter）。
 * 这是信息隐藏（encapsulation）的一种原始形式。
 */
int get_file_counter(void)
{
    return file_scope_counter;
}

/**
 * demonstrate_extern - 演示 extern 的用法
 *
 * extern 声明引用其他文件定义的全局变量。
 * 在同一文件中，extern 也可以引用后面定义的全局变量。
 */
void demonstrate_extern(void)
{
    printf("  【extern 存储类】\n");

    // extern 声明引用全局变量 global_counter
    // 实际上 global_counter 在本文件前面的全局区已经定义了
    // 这里用 extern 只是演示语法
    extern int global_counter;

    printf("  初始 global_counter = %d\n", global_counter);

    global_counter += 10;
    printf("  加 10 后 global_counter = %d\n", global_counter);

    printf("  注意：extern 只是声明，不是定义，不分配存储空间\n");
    printf("  真正的定义在文件作用域中（其他文件或当前文件其他位置）\n");
    printf("\n");

    // extern 常用于跨文件访问全局变量
    printf("  extern 典型用法:\n");
    printf("    // file_a.c\n");
    printf("    int shared_var = 42;  // 定义\n\n");
    printf("    // file_b.c\n");
    printf("    extern int shared_var;  // 声明\n");
    printf("    void func() { printf(\"%%d\", shared_var); }\n");
    printf("\n");
}

/**
 * print_separator - 打印章节分隔线
 * @title: 章节标题
 */
void print_separator(const char* title)
{
    printf("========================================\n");
    printf("  %s\n", title);
    printf("========================================\n\n");
}

/**
 * function_with_counter - 使用静态变量实现函数调用计数器
 *
 * 这是一个经典的 static 用途：记录函数被调用的次数。
 */
void function_with_counter(void)
{
    // 静态计数器 —— 只初始化一次
    static int counter = 0;

    counter++;  // 每次调用递增

    printf("  function_with_counter 被调用了 %d 次\n", counter);
}
