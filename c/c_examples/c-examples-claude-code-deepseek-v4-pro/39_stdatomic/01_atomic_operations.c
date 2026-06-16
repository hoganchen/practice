/*
 * ============================================
 * 知识点：原子操作 <stdatomic.h> (C11)
 * 说明：
 *   原子操作提供无锁的线程间同步。
 *   对原子变量的操作要么完全执行，要么完全不执行，
 *   不会被其他线程中断。
 *
 *   C11 <stdatomic.h> 提供：
 *   原子类型：atomic_int, atomic_bool, atomic_uintptr_t 等
 *   操作函数：atomic_store, atomic_load, atomic_fetch_add
 *   内存序：memory_order_relaxed, acquire, release, seq_cst
 *
 *   内存序（Memory Order）：
 *   memory_order_relaxed — 仅保证原子性，不保证顺序
 *   memory_order_acquire — 之后的读写不能重排到之前
 *   memory_order_release — 之前的读写不能重排到之后
 *   memory_order_acq_rel — acquire + release
 *   memory_order_seq_cst — 全局顺序一致（默认）
 *
 *   注意：Windows 上需使用 Interlocked* 系列函数；
 *   C11 <stdatomic.h> 的支持取决于编译器。
 *
 * 编译方法：
 *   gcc -std=c11 01_atomic_operations.c -o 01_atomic_operations
 *   （部分编译器需要 -latomic 链接）
 *   MSVC: cl 01_atomic_operations.c
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <stdlib.h>
#include <stdatomic.h>   // C11 原子操作
#include <stdbool.h>

// ========== 原子变量 vs 普通变量（演示用）==========
/*
 * 注意：因为 threads.h 支持度有限，我们以概念示例为主。
 * 实际运行时需要 C11 支持完整的线程和原子库。
 */

// 原子计数器（用于线程安全地计数）
atomic_long g_atomic_counter = ATOMIC_VAR_INIT(0);
long g_normal_counter = 0;

// ========== 1. 原子操作基础 ==========
void atomic_basics(void) {
    printf("--- 原子操作基础 ---\n");

    // 声明原子变量
    atomic_int counter = ATOMIC_VAR_INIT(0);
    atomic_bool flag = ATOMIC_VAR_INIT(false);

    // C11 之后可以用更简单的初始化（C23 正式支持）
    // atomic_int counter = 0;

    // 原子存储
    atomic_store(&counter, 42);
    printf("atomic_store(counter, 42)\n");

    // 原子加载
    int val = atomic_load(&counter);
    printf("atomic_load(counter) = %d\n", val);

    // 原子加减
    int prev = atomic_fetch_add(&counter, 5);
    printf("atomic_fetch_add(counter, 5): 旧值=%d, 新值=%d\n",
           prev, atomic_load(&counter));

    prev = atomic_fetch_sub(&counter, 3);
    printf("atomic_fetch_sub(counter, 3): 旧值=%d, 新值=%d\n",
           prev, atomic_load(&counter));

    // 原子交换
    prev = atomic_exchange(&counter, 100);
    printf("atomic_exchange(counter, 100): 旧值=%d, 新值=%d\n",
           prev, atomic_load(&counter));

    // 比较并交换（CAS）
    int expected = 100;
    bool success = atomic_compare_exchange_strong(
        &counter, &expected, 200);
    printf("CAS: 期望=%d, 是否成功=%s, 当前值=%d\n",
           expected, success ? "是" : "否",
           atomic_load(&counter));

    // CAS 失败的情况
    expected = 50;  // 不是当前值 200
    success = atomic_compare_exchange_strong(
        &counter, &expected, 300);
    printf("CAS: 期望=%d(不匹配), 是否成功=%s, "
           "期望被改为=%d\n",
           expected, success ? "是" : "否", expected);
}

// ========== 2. 原子位运算 ==========
void atomic_bitwise(void) {
    printf("\n--- 原子位运算 ---\n");

    atomic_uint flags = ATOMIC_VAR_INIT(0b0011);

    // 置位
    unsigned old = atomic_fetch_or(&flags, 0b0100);
    printf("OR 0b0100: 旧=%u, 新=%u\n", old,
           atomic_load(&flags));

    // 清除位
    old = atomic_fetch_and(&flags, 0b1011);
    printf("AND 0b1011: 旧=%u, 新=%u\n", old,
           atomic_load(&flags));

    // 异或
    old = atomic_fetch_xor(&flags, 0b1111);
    printf("XOR 0b1111: 旧=%u, 新=%u\n", old,
           atomic_load(&flags));
}

// ========== 3. 内存序说明 ==========
void memory_order_explain(void) {
    printf("\n--- 内存序 ---\n");

    printf("memory_order_relaxed:\n");
    printf("  仅保证原子性，CPU 可以自由重排指令\n");
    printf("  适用于：计数器等不需要同步的场景\n\n");

    printf("memory_order_acquire:\n");
    printf("  之后的读写不会被重排到 acquire 之前\n");
    printf("  适用于：读取锁或标志位\n\n");

    printf("memory_order_release:\n");
    printf("  之前的读写不会被重排到 release 之后\n");
    printf("  适用于：写入数据后设置标志\n\n");

    printf("memory_order_seq_cst:\n");
    printf("  全局顺序一致（默认），最严格但最慢\n");
    printf("  所有线程看到相同的执行顺序\n");
}

// ========== 4. 原子标志（atomic_flag）==========
/*
 * atomic_flag 是保证无锁的原子布尔类型。
 * 可以用来实现自旋锁（spinlock）。
 */
atomic_flag spinlock = ATOMIC_FLAG_INIT;

void atomic_flag_demo(void) {
    printf("\n--- atomic_flag 与自旋锁 ---\n");

    // test_and_set：设置标志并返回旧值
    bool was_set = atomic_flag_test_and_set(&spinlock);
    printf("第一次 test_and_set: %s\n",
           was_set ? "已锁定" : "未锁定");

    // 再次尝试
    was_set = atomic_flag_test_and_set(&spinlock);
    printf("第二次 test_and_set: %s\n",
           was_set ? "已锁定" : "未锁定");

    // 清除标志
    atomic_flag_clear(&spinlock);
    printf("调用 clear 后\n");

    was_set = atomic_flag_test_and_set(&spinlock);
    printf("再次 test_and_set: %s\n",
           was_set ? "已锁定" : "未锁定");

    // 自旋锁使用模式
    printf("\n自旋锁模式:\n");
    printf("  while (atomic_flag_test_and_set(&lock)) {\n");
    printf("      // 忙等待，直到锁可用\n");
    printf("  }\n");
    printf("  // 临界区...\n");
    printf("  atomic_flag_clear(&lock);\n");
}

// ========== 5. 原子计数器（实际用途）==========
/*
 * 原子计数器是原子操作最常用的场景。
 * 相比互斥锁，原子操作更轻量。
 */
typedef struct {
    atomic_long counter;
    atomic_bool active;
} Stats;

void stats_example(void) {
    printf("\n--- 原子计数器应用 ---\n");

    Stats stats;
    atomic_init(&stats.counter, 0);
    atomic_init(&stats.active, true);

    // 模拟多线程并发计数（单线程演示 API 用法）
    for (int i = 0; i < 100; i++) {
        atomic_fetch_add(&stats.counter, 1);
    }

    printf("统计计数: %ld\n", atomic_load(&stats.counter));
    printf("活跃状态: %s\n",
           atomic_load(&stats.active) ? "是" : "否");
}

// ========== main ==========
int main(void) {
    printf("===== 原子操作 <stdatomic.h> =====\n\n");

    atomic_basics();
    atomic_bitwise();
    memory_order_explain();

    // test_atomic_perf(); // 性能比较
    atomic_flag_demo();
    stats_example();

    // 检查是否无锁
    printf("\n===== 原子类型的无锁特性 =====\n");
    printf("atomic_bool  是否无锁: %s\n",
           atomic_is_lock_free(&(atomic_bool){0}) ? "是" : "否");
    printf("atomic_int   是否无锁: %s\n",
           atomic_is_lock_free(&(atomic_int){0}) ? "是" : "否");
    printf("atomic_long  是否无锁: %s\n",
           atomic_is_lock_free(&(atomic_long){0}) ? "是" : "否");
    printf("atomic_llong 是否无锁: %s\n",
           atomic_is_lock_free(&(atomic_llong){0}) ? "是" : "否");

    // 总结
    printf("\n===== 原子操作总结 =====\n");
    printf("原子类型：atomic_int, atomic_long, atomic_bool, ...\n");
    printf("核心操作：load, store, fetch_add, exchange, CAS\n");
    printf("原子标志：atomic_flag (保证无锁)\n");
    printf("内存序：  relaxed < acquire < release < seq_cst\n");

    printf("\n适用场景:\n");
    printf("  ✓ 计数器、统计量\n");
    printf("  ✓ 标志位、状态切换\n");
    printf("  ✓ 无锁数据结构\n");

    printf("\n不适用场景:\n");
    printf("  ✗ 复杂临界区（用互斥锁）\n");
    printf("  ✗ 跨平台需要检查编译器支持\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. 原子操作是不可中断的线程安全操作
 * 2. atomic_flag 是保证无锁的原子类型
 * 3. 内存序控制指令重排的可见性
 * 4. CAS (compare_exchange_strong) 是无锁编程的基础
 * 5. 原子操作比互斥锁更轻量，但仅适用于简单操作
 * 6. <stdatomic.h> 是 C11 标准，gcc/clang 支持较好
 * 7. Windows 上可用 Interlocked* 系列函数替代
 * ============================================
 */
