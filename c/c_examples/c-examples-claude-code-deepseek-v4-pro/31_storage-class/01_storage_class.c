/*
 * ============================================
 * 知识点：存储类别说明符（Storage Class Specifiers）
 * 说明：
 *   存储类别说明符控制变量的作用域、生命周期
 *   和链接属性。C 语言中有以下存储类别：
 *
 *   auto       — 自动存储（默认，局部变量）
 *   register   — 建议存储在 CPU 寄存器
 *   static     — 静态存储，控制生命周期和链接
 *   extern     — 外部链接，引用其他文件的变量
 *   _Thread_local — 线程局部存储（C11）
 *
 *   链接属性（Linkage）：
 *   外部链接 (external)  — 所有文件可见
 *   内部链接 (internal)  — 仅本文件可见
 *   无链接   (none)     — 仅代码块可见
 *
 * 编译方法：
 *   gcc 01_storage_class.c -o 01_storage_class
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"

/*
 * 全局变量（默认外部链接）
 * 作用域：整个项目所有文件
 * 生命周期：程序启动到结束
 * 自动初始化为 0
 */
int global_var = 100;           // 外部链接（其他文件可用 extern 引用）
static int file_static = 200;   // 静态全局变量（内部链接，仅本文件）

// ========== 1. auto 存储类别 ==========
/*
 * auto 是局部变量的默认存储类别，通常省略不写。
 * 作用域：所在代码块
 * 生命周期：进入代码块创建，退出销毁
 * 不自动初始化（内容不确定）
 */
void auto_example(void) {
    printf("--- auto (自动变量) ---\n");

    auto int x = 10;   // auto 可省略
    int y = 20;         // 等价于 auto int y

    // auto 不能用于全局变量
    printf("  auto x = %d\n", x);
    printf("  auto 是局部变量的默认类别\n\n");
}

// ========== 2. register 存储类别 ==========
/*
 * register 建议编译器将变量存储在 CPU 寄存器中。
 * 只是建议，编译器可能忽略。
 * 限制：不能取地址（&）。
 */
void register_example(void) {
    printf("--- register (寄存器变量) ---\n");

    register int counter = 0;
    // printf("%p\n", &counter);  // 编译错误！不能取地址

    for (register int i = 0; i < 5; i++) {
        counter += i;
    }

    printf("  register counter = %d\n", counter);
    printf("  注意：不能对 register 变量取地址\n\n");
}

// ========== 3. static 局部变量 ==========
/*
 * static 局部变量：
 * - 作用域：仅限于所在函数
 * - 生命周期：程序启动到结束
 * - 只初始化一次
 * - 自动初始化为 0
 */
void static_local_example(void) {
    // 每次调用该函数，static 变量的值会保持
    static int call_count = 0;  // 只初始化一次
    int normal_var = 0;         // 每次调用都重新初始化

    call_count++;
    normal_var++;

    printf("--- static 局部变量 ---\n");
    printf("  第 %d 次调用\n", call_count);
    printf("  static 变量: %d (持续累加)\n", call_count);
    printf("  普通变量:   %d (每次重置)\n\n", normal_var);
}

// ========== 4. static 全局变量/函数 ==========
/*
 * static 用于文件作用域时：
 * - 限制链接为内部链接
 * - 仅在本文件可见
 * - 其他文件无法引用
 */
static int helper_count = 0;  // 外部文件无法访问

static void helper_function(void) {
    helper_count++;
    printf("  helper 函数被调用 (count=%d)\n", helper_count);
}

void static_global_example(void) {
    printf("--- static 全局变量/函数 ---\n");
    printf("  file_static = %d (仅本文件可见)\n", file_static);
    helper_function();
    helper_function();
    printf("\n");
}

// ========== 5. extern 声明 ==========
/*
 * extern 声明变量在其他文件中定义。
 * 不分配存储空间，只是引用声明。
 *
 * 在另一个 .c 文件中：
 *   int external_var = 42;  // 定义
 *
 * 在本文件中：
 *   extern int external_var;  // 声明（引用）
 */
int external_value = 999;  // 实际定义（其他文件可用 extern 引用）

void extern_example(void) {
    printf("--- extern (外部声明) ---\n");

    // 引用同一文件中的全局变量
    extern int global_var;  // 可省略（因为在同一文件）
    printf("  global_var = %d (外部链接)\n", global_var);

    // extern 可用于函数声明
    printf("  extern 告诉编译器变量/函数在其他文件\n\n");
}

// ========== 7. 函数声明中的 static/extern ==========
/*
 * static 函数：仅在本文件可见（内部链接）
 * extern 函数：默认就是外部链接，通常省略
 */
static int internal_helper(int x) {
    return x * 2;
}

extern int external_helper(int x) {
    return x * 3;
}

// ========== 8. 多文件变量共享演示 ==========
/*
 * 演示如何在文件间共享变量。
 * 在一个文件中定义，另一个文件用 extern 引用。
 */

// 这里定义一个可以被其他文件引用的变量
int shared_counter = 0;

void increment_shared(void) {
    shared_counter++;
    printf("  shared_counter = %d\n", shared_counter);
}

// ========== main ==========
int main() {
    printf("===== 存储类别说明符 =====\n\n");

    auto_example();
    register_example();

    // static 局部变量演示
    printf("--- static 局部变量 (多次调用) ---\n");
    static_local_example();
    static_local_example();
    static_local_example();

    static_global_example();

    // 内部链接函数
    printf("--- static/extern 函数 ---\n");
    printf("  internal_helper(5) = %d (static 函数)\n",
           internal_helper(5));
    printf("  external_helper(5) = %d (extern 函数)\n\n",
           external_helper(5));

    // 跨文件变量引用
    printf("--- 外部链接变量 ---\n");
    increment_shared();
    increment_shared();
    increment_shared();

    // ========== 总结表 ==========
    printf("\n===== 存储类别总结表 =====\n");
    printf("说明符      | 作用域   | 生命周期   | 链接   | 初始化\n");
    printf("-----------|---------|-----------|-------|-------\n");
    printf("auto       | 代码块   | 代码块     | 无    | 不确定\n");
    printf("register   | 代码块   | 代码块     | 无    | 不确定\n");
    printf("static(局部)| 函数    | 程序全程   | 无    | 0\n");
    printf("static(全局)| 本文件   | 程序全程   | 内部  | 0\n");
    printf("extern     | 全局     | 程序全程   | 外部  | N/A\n");
    printf("全局变量   | 全局     | 程序全程   | 外部  | 0\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. auto — 局部变量默认（通常省略）
 * 2. register — 建议存寄存器，不能取地址
 * 3. static 局部 — 持久化，只初始化一次
 * 4. static 全局/函数 — 仅本文件可见
 * 5. extern — 引用其他文件定义的变量/函数
 * 6. 全局变量默认外部链接，static 限制为内部链接
 * 7. static 函数用于模块内部封装
 * ============================================
 */
