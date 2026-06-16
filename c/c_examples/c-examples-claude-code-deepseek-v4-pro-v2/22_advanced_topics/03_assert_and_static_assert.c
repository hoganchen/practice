/*
 * 知识点：断言 (Assertions) —— 运行时和编译时断言
 *
 * 编译指令：gcc 03_assert_and_static_assert.c -o 03_assert_and_static_assert.exe -std=c11 -Wall
 * 运行指令：./03_assert_and_static_assert.exe
 *
 * 本文件演示两种断言机制：
 *   - assert()          —— 运行时断言（<assert.h>）
 *   - _Static_assert()  —— 编译时静态断言（C11 关键字）
 *
 * 断言的作用：
 *   断言用于在开发和测试阶段检查"应该永远为真"的条件
 *   如果条件为假，断言会立即中止程序并报告错误
 *   断言不是错误处理机制（错误处理用 if/return）
 *
 * 运行时断言 (assert)：
 *   - 在运行时检查条件
 *   - 通过定义 NDEBUG 宏可完全禁用（发布版本）
 *   - 失败时输出：文件名、行号、函数名、条件
 *
 * 静态断言 (_Static_assert)：
 *   - 在编译时检查常量表达式
 *   - 不受 NDEBUG 影响，始终生效
 *   - 用于检查类型大小、结构体对齐等编译期常量
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>    /* assert() 宏 */

/* ===== 静态断言 (编译时检查) ===== */

/*
 * _Static_assert(常量表达式, 错误消息)
 * 在编译时求值表达式的真值
 * 如果为 false（0），编译失败并显示错误消息
 *
 * 这是一个关键字（C11 标准），无需包含头文件
 */

/* 确保 int 类型至少占 4 个字节 */
_Static_assert(sizeof(int) >= 4,
               "int 类型必须至少 4 字节！");

/* 确保指针大小至少 4 字节（32 位系统以上）*/
_Static_assert(sizeof(void *) >= 4,
               "指针大小必须至少 4 字节！");

/* 确保 char 类型正好占 1 个字节 */
_Static_assert(sizeof(char) == 1,
               "char 类型必须为 1 字节！");

/* 结构体大小检查 */
typedef struct {
    int id;
    char name[32];
    double score;
} Student;

_Static_assert(sizeof(Student) >= sizeof(int) + 32 + sizeof(double),
               "Student 结构体大小异常！");

/*
 * 注意：静态断言中的表达式必须是编译期常量
 * 以下代码会导致编译错误（因为函数调用不是常量）：
 *   _Static_assert(rand() > 0, "not constant");
 */

/* ===== 运行时断言 (assert) ===== */

/**
 * 安全的除法函数
 * 使用 assert 检查除数不为 0
 * numerator: 分子
 * denominator: 分母
 * 返回值: 除法结果
 */
double safe_divide(double numerator, double denominator) {
    /*
     * assert(条件)
     * 如果条件为 false，程序会立即中止并打印：
     *   Assertion failed: condition, file filename, line line, function func
     *
     * 注意：assert 是宏，不是函数
     */
    assert(denominator != 0.0 && "除数不能为 0！");

    return numerator / denominator;
}

/**
 * 数组访问函数（带边界检查）
 * arr: 数组
 * size: 数组大小
 * index: 索引
 * 返回值: 数组元素
 */
int array_get(const int arr[], int size, int index) {
    /*
     * 使用多个 assert 检查前置条件
     * 如果任何条件不满足，程序立即中止
     */
    assert(arr != NULL && "数组指针不能为 NULL");
    assert(size > 0 && "数组大小必须大于 0");
    assert(index >= 0 && index < size && "数组索引越界！");

    return arr[index];
}

/**
 * 字符串复制（带断言检查）
 * dest: 目标缓冲区
 * src: 源字符串
 * dest_size: 目标缓冲区大小
 */
void safe_strcpy(char *dest, const char *src, size_t dest_size) {
    assert(dest != NULL && "目标缓冲区不能为 NULL");
    assert(src != NULL && "源字符串不能为 NULL");
    assert(dest_size > 0 && "缓冲区大小必须大于 0");

    /* 确保有足够的空间存放字符串（包括结束符 '\0'）*/
    size_t src_len = strlen(src);
    assert(src_len < dest_size && "源字符串太长，无法放入缓冲区！");

    strcpy(dest, src);
}

/**
 * 内存分配函数（断言分配成功）
 */
void *safe_malloc(size_t size) {
    void *ptr = malloc(size);
    /*
     * malloc 失败时使用 assert 报告
     * 注意：生产代码中应该检查 NULL 而不是使用 assert
     * 这里仅作演示
     */
    assert(ptr != NULL && "内存分配失败！");
    return ptr;
}

/* ===== 演示 NDEBUG 的效果 ===== */

/*
 * 如果定义了 NDEBUG 宏，assert 宏会被完全移除
 *
 * 编译发布版本时：
 *   gcc 03_assert_and_static_assert.c -o release.exe -std=c11 -Wall -DNDEBUG
 *
 * 此时所有 assert 调用都会被预处理器移除（不生成任何代码）
 * 但 _Static_assert 仍然会生效！
 */

/* ===== 主函数 ===== */

int main() {
    printf("============================================\n");
    printf("  断言 (Assert) 演示\n");
    printf("============================================\n\n");

    /* ===== 1. _Static_assert 已通过编译 ===== */
    printf("----- 1. 静态断言 (编译时) -----\n");

    printf("  所有 _Static_assert 已通过编译检查：\n");
    printf("  ✓ sizeof(int) >= 4\n");
    printf("  ✓ sizeof(void*) >= 4\n");
    printf("  ✓ sizeof(char) == 1\n");
    printf("  ✓ Student 结构体大小正常\n\n");

    /* ===== 2. assert 正常使用 ===== */
    printf("----- 2. 运行时 assert 正常使用 -----\n");

    /* 正常的除法 */
    double result = safe_divide(10.0, 3.0);
    printf("  safe_divide(10.0, 3.0) = %.4f\n", result);

    /* 数组边界检查 */
    int arr[] = {1, 2, 3, 4, 5};
    int val = array_get(arr, 5, 2);
    printf("  array_get(arr, 5, 2) = %d\n", val);

    /* 字符串复制 */
    char buffer[32];
    safe_strcpy(buffer, "Hello, World!", sizeof(buffer));
    printf("  safe_strcpy: \"%s\"\n", buffer);

    printf("\n");

    /* ===== 3. 触发 assert 失败 ===== */
    printf("----- 3. 触发 assert 失败演示 -----\n");

    printf("  即将触发除零断言...\n");
    printf("  （按任意键继续，或 Ctrl+C 跳过）\n");
    getchar();

    /*
     * 取消注释下面的代码来观察断言失败的效果：
     *
     *   printf("  尝试 safe_divide(5.0, 0.0)...\n");
     *   double bad = safe_divide(5.0, 0.0);
     *
     * 输出类似：
     *   Assertion failed: denominator != 0.0 && "除数不能为 0！",
     *   file 03_assert_and_static_assert.c, line 62, function safe_divide
     */
    printf("  （注释掉了触发代码，避免程序终止）\n\n");

    /* ===== 4. assert vs 错误处理 ===== */
    printf("----- 4. assert vs 正式错误处理 -----\n");

    printf("  assert 场景：\n");
    printf("    - 检查程序内部的不变条件（绝对不应发生的情况）\n");
    printf("    - 调试阶段检查函数参数的前置条件/后置条件\n");
    printf("    - 检查算法逻辑的正确性\n\n");

    printf("  if/return 错误处理场景：\n");
    printf("    - 用户输入错误\n");
    printf("    - 文件打开失败\n");
    printf("    - 网络连接失败\n");
    printf("    - 内存分配失败\n\n");

    /* ===== 5. NDEBUG 的影响 ===== */
    printf("----- 5. NDEBUG 宏 -----\n");

#ifdef NDEBUG
    printf("  当前已定义 NDEBUG：assert 宏已被禁用\n");
#else
    printf("  当前未定义 NDEBUG：assert 宏生效\n");
#endif
    printf("  编译时使用 -DNDEBUG 可禁用 assert\n");
    printf("  建议：调试时启用 assert，发布时禁用\n");
    printf("  注意：_Static_assert 不受 NDEBUG 影响\n\n");

    /* ===== 6. 使用建议 ===== */
    printf("----- 6. 断言使用建议 -----\n");

    printf("  1) 断言用于检查'不可能发生'的情况\n");
    printf("  2) 不要用 assert 检查用户输入（用 if 检查）\n");
    printf("  3) assert 的条件不应有副作用\n");
    printf("  4) 不要将函数调用放在 assert 中：\n");
    printf("     [错误] assert(func_returning_bool())\n");
    printf("     [错误] assert(ptr = malloc(size))\n");
    printf("  5) 静态断言用于编译时类型/大小检查\n");
    printf("  6) assert 失败信息应清晰描述错误\n");

    printf("\n============================================\n");
    printf("  程序结束\n");
    printf("============================================\n");

    return 0;
}
