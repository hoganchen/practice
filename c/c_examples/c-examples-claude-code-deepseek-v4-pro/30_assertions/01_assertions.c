/*
 * ============================================
 * 知识点：断言 <assert.h>
 * 说明：
 *   断言用于在调试阶段验证程序的假设。
 *   当条件为假（0）时，assert 会打印错误信息
 *   并终止程序。
 *
 *   两种断言：
 *   1. assert()       — 运行时断言（<assert.h>）
 *   2. _Static_assert — 编译时断言（C11, <assert.h>）
 *
 *   禁用断言：定义 NDEBUG 宏后，assert 不再起作用。
 *   编译时：gcc -DNDEBUG file.c
 *
 * 编译方法：
 *   gcc 01_assertions.c -o 01_assertions
 *   禁用断言：gcc -DNDEBUG 01_assertions.c -o assertions
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <assert.h>   // assert 宏
#include <string.h>
#include <stdlib.h>

// ========== 编译时断言 (C11) ==========
/*
 * _Static_assert 在编译期检查条件。
 * 如果条件为假，编译失败。
 * C11 标准引入。
 */

// 确保 int 至少 4 字节
_Static_assert(sizeof(int) >= 4,
               "int 必须至少 4 字节才能运行此程序");

// 确保结构体大小符合预期
_Static_assert(sizeof(double) == 8,
               "double 必须为 8 字节");

// 数组长度约束
#define MAX_NAME 50
_Static_assert(MAX_NAME > 0 && MAX_NAME <= 256,
               "MAX_NAME 必须在 1-256 之间");

// ========== 基本 assert 使用 ==========
void basic_assert(void) {
    printf("--- 基本 assert ---\n");

    int x = 10;
    // 断言 x > 0，条件为真，继续执行
    assert(x > 0);
    printf("x = %d, assert(x > 0) 通过\n", x);

    // 这段代码不会执行（取消注释会触发断言失败）
    // int y = -5;
    // assert(y >= 0);  // 断言失败！输出错误并 abort()
    // printf("这一行不会执行\n");
}

// ========== 参数验证 ==========
void set_age(int *age, int value) {
    // 检查指针不为 NULL
    assert(age != NULL);
    // 检查年龄范围
    assert(value >= 0 && value <= 150);

    *age = value;
    printf("年龄设置为: %d\n", *age);
}

// ========== 不变量检查 ==========
int divide(int a, int b) {
    // 前置条件
    assert(b != 0 && "除数不能为 0");

    int result = a / b;

    // 后置条件
    assert(result * b == a || (a % b) != 0);

    return result;
}

// ========== 排序后验证 ==========
void sort_and_verify(int arr[], int size) {
    // 简单选择排序
    for (int i = 0; i < size - 1; i++) {
        int min_idx = i;
        for (int j = i + 1; j < size; j++) {
            if (arr[j] < arr[min_idx]) {
                min_idx = j;
            }
        }
        int temp = arr[i];
        arr[i] = arr[min_idx];
        arr[min_idx] = temp;
    }

    // 验证：数组已有序
    for (int i = 0; i < size - 1; i++) {
        assert(arr[i] <= arr[i + 1]);  // 后置条件
    }
    printf("排序验证通过\n");
}

// ========== NDEBUG 效果演示 ==========
void ndebug_demo(void) {
    printf("\n--- NDEBUG 效果 ---\n");

#ifdef NDEBUG
    printf("NDEBUG 已定义: assert 被禁用\n");
#else
    printf("NDEBUG 未定义: assert 生效中\n");
    printf("编译时加 -DNDEBUG 可禁用所有 assert\n");
#endif
}

// ========== assert expression 技巧 ==========
void assert_tips(void) {
    printf("\n--- assert 技巧 ---\n");

    // 技巧1：assert 中不要有副作用
    // 危险的写法：
    // assert(i++ < 10);  // NDEBUG 下 i++ 不会执行！
    // 正确写法：
    // int check = i++;
    // assert(check < 10);

    printf("  不要: assert(i++ < 10);  // NDEBUG 时副作用消失\n");
    printf("  而要: int val = i++; assert(val < 10);\n");

    // 技巧2：添加错误信息
    // assert(ptr != NULL && "ptr should not be NULL");
    printf("  可加信息: assert(x > 0 && \"x must be positive\");\n");

    // 技巧3：assert vs if-else
    printf("\n  assert 用于调试时验证假设\n");
    printf("  if-else 用于处理预期的错误情况\n");
    printf("  两者有本质区别，不要混淆\n");
}

// ========== 在生产代码中替代 assert ==========
/*
 * 生产代码中禁止使用 assert（因为可能被禁用）。
 * 可以自定义验证宏：
 */
#if defined(DEBUG) || !defined(NDEBUG)
    #define VERIFY(cond, msg) \
        do { \
            if (!(cond)) { \
                fprintf(stderr, "验证失败 [%s:%d]: %s - %s\n", \
                        __FILE__, __LINE__, #cond, msg); \
                abort(); \
            } \
        } while (0)
#else
    #define VERIFY(cond, msg)  // 空操作
#endif

void verify_example(void) {
    printf("\n--- 自定义 VERIFY 宏 ---\n");
    int value = 42;
    VERIFY(value > 0, "value 必须为正数");
    VERIFY(value < 100, "value 必须小于 100");
    printf("自定义验证通过\n");
}

// ========== main ==========
int main() {
    printf("===== 断言 <assert.h> =====\n\n");

    // ========== 基本用法 ==========
    basic_assert();

    // ========== 参数验证 ==========
    printf("\n--- 参数验证 ---\n");
    int age;
    set_age(&age, 25);
    // set_age(NULL, 25);   // 会触发 assert
    // set_age(&age, -1);   // 会触发 assert

    // ========== 函数前置/后置条件 ==========
    printf("\n--- 前置/后置条件 ---\n");
    printf("10 / 3 = %d\n", divide(10, 3));
    // divide(10, 0);  // 会触发 assert

    // ========== 排序验证 ==========
    printf("\n--- 排序验证 ---\n");
    int arr[] = {5, 3, 8, 1, 9, 2, 7, 4, 6};
    int size = sizeof(arr) / sizeof(arr[0]);
    sort_and_verify(arr, size);

    printf("排序结果: ");
    for (int i = 0; i < size; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");

    // ========== NDEBUG ==========
    ndebug_demo();

    // ========== 技巧 ==========
    assert_tips();

    // ========== 自定义验证 ==========
    verify_example();

    // ========== 总结 ==========
    printf("\n===== 断言使用原则总结 =====\n");
    printf("使用 assert 的场景:\n");
    printf("  ✓ 检查函数前置条件（参数约束）\n");
    printf("  ✓ 检查函数后置条件（结果验证）\n");
    printf("  ✓ 验证不变量（循环不变式等）\n");
    printf("  ✓ 不可能发生的分支\n");

    printf("\n不应使用 assert 的场景:\n");
    printf("  ✗ 用户输入验证（用 if-else）\n");
    printf("  ✗ 文件打开失败等可预见的错误\n");
    printf("  ✗ 带有副作用的表达式\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. assert(条件) — 条件为假时终止并报错
 * 2. 定义 NDEBUG 可禁用所有 assert
 * 3. _Static_assert — 编译时断言（C11）
 * 4. assert 中不要有副作用（NDEBUG 时会消失）
 * 5. assert 用于调试，if-else 用于错误处理
 * 6. 生产代码可自定义 VERIFY 宏替代 assert
 * ============================================
 */
