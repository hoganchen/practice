/*
 * 知识点：多次 free —— 重复释放的危害与防范
 *         (Double Free / Multiple Free — Undefined Behavior)
 *
 * 本程序演示 malloc 分配内存后进行多次 free 的各种情况，包括：
 *   1. 正确的一次 free（基线对比）
 *   2. free(NULL) 是安全的（标准保证）
 *   3. 释放后置 NULL 再 free（安全做法）
 *   4. SAFE_FREE 宏 —— 自动置 NULL
 *   5. double free —— 对同一块内存 free 两次（未定义行为）⚠
 *   6. triple free —— free 三次（未定义行为）⚠
 *   7. Double Free 导致堆损坏的连锁反应 ⚠
 *   8. 如何避免 Double Free（最佳实践总结）
 *
 * 关键知识点：
 *   - 对同一块已释放内存再次 free 是"未定义行为"(Undefined Behavior)
 *   - 未定义行为可能：崩溃、数据损坏、静默通过，结果不可预测
 *   - 释放后将指针置 NULL 可以有效防止 double free
 *   - free(NULL) 是安全的，标准库规定什么都不做
 *   - double free 是安全漏洞的常见来源（堆损坏攻击）
 *
 * ⚠ 注意：由于 double free 是未定义行为，不同平台/编译器/运行时的
 *    表现可能完全不同。在 Windows (MSVC CRT) 上第5节之后可能直接崩溃，
 *    这是正常现象。请先阅读第1~4节的安全内容。
 *
 * 编译与运行：
 *   gcc 08_double_free.c -o 08_double_free.exe -std=c11 -Wall
 *   gcc 08_double_free.c -o 08_double_free.exe -std=c11 -Wall -static（静态编译，推荐）
 *   ./08_double_free.exe
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>

/*
 * 安全释放宏 —— 释放指针后自动置 NULL，防止悬空指针和 double free
 *
 * 使用宏而不是函数的原因：
 *   宏可以直接修改传入的指针变量本身（通过指针的指针也可以，但宏更简洁）
 */
#define SAFE_FREE(ptr)  do { \
    free((ptr));             \
    (ptr) = NULL;            \
} while (0)

/*
ptr = NULL 只修改了函数栈帧上的局部副本，返回后调用方的 p5 依然指向那块已释放的内存（悬空指针/野指针）。
*/
void invalid_free(void *ptr)
{
    printf("ptr address: %p, point address: %p\n", &ptr, ptr);
    free(ptr);
    ptr = NULL;  // ← 只修改了局部副本！
}

void free_mem(void **ptr)
{
    if (ptr == NULL) {
        return;  // 防止传入 NULL 导致 *ptr 崩溃
    }
    printf("ptr address: %p, point address: %p\n", ptr, *ptr);
    free(*ptr);
    *ptr = NULL;  // ← 通过双重指针才能真正修改调用方的指针！
}

int main(void)
{
    // 禁用 stdout 缓冲，确保崩溃前的内容能立即输出
    setvbuf(stdout, NULL, _IONBF, 0);
    /* ======================================================== */
    /*  安全部分 —— 这些示例在任何平台上都能安全运行             */
    /* ======================================================== */

    /* ========== 1. 正确的一次 free（基线） ========== */

    printf("========================================\n");
    printf("  1. 正确的 malloc + free（基线示例）\n");
    printf("========================================\n");

    int *p1 = (int *)malloc(5 * sizeof(int));
    if (p1 == NULL) {
        printf("内存分配失败！\n");
        return 1;
    }

    // 初始化并使用
    for (int i = 0; i < 5; i++) {
        p1[i] = i * 10;
    }
    printf("p1[2] = %d\n", p1[2]);  // 正常使用

    // 释放一次
    free(p1);
    printf("✓ 已释放 p1（一次 free）\n\n");


    /* ========== 2. free(NULL) 是安全的 ========== */

    printf("========================================\n");
    printf("  2. free(NULL) —— 标准保证安全\n");
    printf("========================================\n");

    /*
     * C 标准（ISO C 99 §7.20.3.2）规定：
     *   "If ptr is a null pointer, no action occurs."
     *   如果 ptr 是空指针，不执行任何动作。
     */
    free(NULL);
    printf("✓ free(NULL) 安全执行，什么都不做\n");

    // 连续 free(NULL) 也没问题
    free(NULL);
    free(NULL);
    printf("✓ 连续 free(NULL) 也没问题\n\n");


    /* ========== 3. free_mem —— 函数版安全释放（void**） ========== */
    /*
     * 使用 free_mem(void **ptr) 函数来释放内存。
     * 通过传递指针的地址（&p），函数内部 *ptr = NULL
     * 能真正修改调用方的指针，使其指向 NULL。
     *
     * 对比宏版本（SAFE_FREE），函数版本的好处：
     *   - 类型检查更严格
     *   - 没有宏的副作用风险（如 SAFE_FREE(p++)）
     * 但需要注意调用时必须取地址：free_mem(&ptr)
     */

    printf("========================================\n");
    printf("  3. free_mem 函数版安全释放（void**）\n");
    printf("========================================\n");

    int *p3 = (int *)malloc(5 * sizeof(int));
    if (p3 == NULL) {
        printf("内存分配失败！\n");
        return 1;
    }

    printf("调用前：&p3 = %p, p3 = %p\n", &p3, p3);
    free_mem((void **)&p3);  // 传递指针的地址
    printf("调用后：&p3 = %p, p3 = %p\n", &p3, p3);

    if (p3 == NULL) {
        printf("✓ free_mem 成功将 p3 置为 NULL！\n\n");
    }


    /* ========== 4. SAFE_FREE 宏的使用 ========== */
    /*
     * 使用 SAFE_FREE 宏可以确保每次释放后自动置 NULL，
     * 避免忘记手动置 NULL 导致的问题
     */

    printf("========================================\n");
    printf("  4. SAFE_FREE 宏 —— 自动置 NULL\n");
    printf("========================================\n");

    int *p4 = (int *)malloc(5 * sizeof(int));
    if (p4 == NULL) {
        printf("内存分配失败！\n");
        return 1;
    }

    printf("使用 SAFE_FREE(p4) 释放...\n");
    SAFE_FREE(p4);  // free + 自动置 NULL

    printf("再次 SAFE_FREE(p4) —— 安全（p4 已是 NULL）\n");
    SAFE_FREE(p4);  // 再次释放 —— 安全，因为 p4 已经是 NULL

    printf("✓ SAFE_FREE 宏让多次释放安全可靠\n\n");


    /* ======================================================== */
    /*  危险部分 —— 从下一节开始可能崩溃！                       */
    /* ======================================================== */

    printf("\n");
    printf("========= 分割线：以下为未定义行为演示 =========\n");
    printf("  从下一节开始，程序可能会崩溃，这是预期行为。\n");
    printf("  如果程序已崩溃，请注释掉第5~7节的代码后重新运行。\n");
    printf("===============================================\n\n");


    /* ========== 5. Double Free —— 重复释放 ========== */
    /*
     * double free 是未定义行为！
     *
     * 可能的结果：
     *   - 程序立即崩溃（最常见）
     *   - 堆数据结构损坏，后续 malloc/free 异常
     *   - 静默通过，但潜伏堆漏洞
     *   - 被攻击者利用执行任意代码（堆风水攻击）
     *
     * 在 glibc 中，double free 可能会触发：
     *   *** Error in `./a.out': double free or corruption (!prev): ...
     *   然后 abort()
     *
     * 在 Windows (MSVC CRT) 中，通常触发访问冲突或断言失败。
     */

    printf("========================================\n");
    printf("  5. Double Free —— 重复释放（未定义行为）\n");
    printf("========================================\n");
    printf("（此平台可能会在此处崩溃，这是正常的）\n");

    int *p5 = (int *)malloc(5 * sizeof(int));
    if (p5 == NULL) {
        printf("内存分配失败！\n");
        return 1;
    }

    // 故意不用 free_mem —— 这里要演示裸指针 double free 的后果
    printf("第一次 free(p5)...\n");
    free(p5);   // 第一次释放 —— 正常

    printf("第二次 free(p5)...\n");
    free(p5);   // ← 危险！double free！未定义行为！

    /*
     * 如果能执行到这里（取决于运行时行为），但堆可能已损坏
     */
    printf("⚠ double free 未立即崩溃，但堆可能已损坏\n");
    printf("   后续的 malloc/free 可能异常\n\n");


    /* ========== 6. Triple Free —— free 三次 ========== */

    printf("========================================\n");
    printf("  6. Triple Free —— 释放三次\n");
    printf("========================================\n");

    int *p6 = (int *)malloc(5 * sizeof(int));
    if (p6 == NULL) {
        printf("内存分配失败！\n");
        return 1;
    }

    printf("第一次 free(p6)...\n");
    free(p6);

    printf("第二次 free(p6)...\n");
    free(p6);   // ← double free，堆已损坏

    printf("第三次 free(p6)...\n");
    free(p6);   // ← triple free，雪上加霜

    printf("⚠ triple free 执行完毕（或已崩溃）\n\n");


    /* ========== 7. Double Free 的危害演示 ========== */
    /*
     * double free 不仅仅可能导致崩溃，还会损坏堆内存管理数据结构。
     * 下面演示一个 double free 如何影响后续的 malloc 行为。
     *
     * 注意：这个演示在不同平台上表现可能完全不同。
     * 在某些环境下，double free 导致的堆损坏可能不会立即显现，
     * 而是在后续某个 malloc 或 free 时突然崩溃 ——
     * 这就是"未定义行为"的可怕之处：问题可能在千里之外爆发。
     */

    printf("========================================\n");
    printf("  7. Double Free 的连锁危害\n");
    printf("========================================\n");
    printf("（此演示可能触发运行时错误，这是预期行为）\n");

    {
        int *victim = (int *)malloc(10 * sizeof(int));
        if (victim == NULL) {
            printf("内存分配失败！\n");
            return 1;
        }

        // 正常使用
        for (int i = 0; i < 10; i++) {
            victim[i] = i;
        }

        printf("victim[5] = %d\n", victim[5]);  // 正常：5

        // double free —— 破坏堆
        free(victim);
        free(victim);   // ← double free，堆可能已损坏

        // 后续的 malloc 可能因为堆损坏而失败或异常
        int *next = (int *)malloc(10 * sizeof(int));
        if (next == NULL) {
            printf("后续 malloc 失败（可能是堆损坏导致的）\n");
        } else {
            // 如果能分配成功，堆可能已被污染
            // 在某些实现中，next 甚至可能指向 victim 原来的内存！
            printf("后续 malloc 看似成功，但堆可能已损坏\n");
            free(next);
        }
    }
    printf("⚠ double free 可能导致后续内存操作不可预测\n\n");


    /* ========== 8. 如何避免 Double Free ========== */
    /*
     * 最佳实践总结：
     *
     * 1. 每次 free 后立即将指针置 NULL
     *    或者使用 SAFE_FREE 宏
     *
     * 2. 使用静态分析工具（如 cppcheck, scan-build）
     *    可以检测出潜在的 double free 路径
     *
     * 3. 使用动态检测工具：
     *    - Linux: Valgrind (memcheck), AddressSanitizer (-fsanitize=address)
     *    - Windows: Application Verifier, Dr. Memory
     *    - macOS: Clang ASan, MallocStackLogging
     *
     * 4. 代码审查：确保每个 malloc 有且仅有一个对应的 free
     *
     * 5. 遵循"谁分配谁释放"的原则（ownership 模型）
     *
     * 6. 在复杂场景中考虑使用 RAII 风格（通过 goto cleanup 或
     *    函数封装确保单一释放点）
     */

    printf("========================================\n");
    printf("  总结：Double Free 防范要点\n");
    printf("========================================\n");
    printf("1. free 后立即置 NULL —— 最简单有效的防范\n");
    printf("2. 使用 SAFE_FREE 宏减少遗漏\n");
    printf("3. 用 Valgrind / ASan 动态检测\n");
    printf("4. 用 cppcheck / scan-build 静态分析\n");
    printf("5. 代码审查：每个 malloc 对应唯一的 free\n\n");

    printf("===== 程序结束 =====\n");

    return 0;
}
