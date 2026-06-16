/*
 * ============================================
 * 知识点：非局部跳转 <setjmp.h>
 * 说明：
 *   setjmp/longjmp 提供跨函数跳转的能力，
 *   类似于"增强版 goto"（可以跨函数）。
 *   用于深层嵌套中的错误恢复。
 *
 *   核心函数：
 *   setjmp(jmp_buf)  — 保存当前栈环境，返回 0
 *   longjmp(jmp_buf, val) — 跳回 setjmp 位置，返回 val
 *
 *   类比：
 *   try       → setjmp(...)
 *   throw     → longjmp(...)
 *   catch     → setjmp 的返回值处理
 *
 *   注意：longjmp 会"展开"栈，跳过中间
 *   函数的正常返回过程，因此已打开的
 *   资源需要进行清理。
 *
 * 编译方法：
 *   gcc 01_setjmp_longjmp.c -o 01_setjmp_longjmp
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <setjmp.h>   // setjmp, longjmp, jmp_buf
#include <stdlib.h>

// ========== 1. 基础用法 ==========
/*
 * jmp_buf 用于存储栈环境
 */
jmp_buf env_buffer;

void first_function(void) {
    printf("  进入 first_function\n");
    // longjmp 跳回 setjmp 位置，返回值为 1
    longjmp(env_buffer, 1);
    printf("  这行不会执行\n");
}

void basic_demo(void) {
    printf("--- 基本 setjmp/longjmp ---\n");

    int ret = setjmp(env_buffer);
    if (ret == 0) {
        // 第一次到达，返回值为 0
        printf("  setjmp 第一次返回 (ret=%d)\n", ret);
        printf("  即将调用 first_function...\n");
        first_function();
        printf("  这行不会执行\n");
    } else {
        // 从 longjmp 跳回，返回值为 longjmp 的第二个参数
        printf("  longjmp 跳回! (ret=%d)\n", ret);
        printf("  恢复执行\n");
    }
}

// ========== 2. 错误处理模式 ==========
/*
 * 类似 try-catch 的错误处理
 */
jmp_buf error_env;

#define ERR_FILE    -1
#define ERR_MEMORY  -2
#define ERR_PARAM   -3

void risky_operation(int type) {
    printf("  执行危险操作...\n");

    switch (type) {
        case 1:
            printf("  发生文件错误!\n");
            longjmp(error_env, ERR_FILE);
            break;
        case 2:
            printf("  发生内存错误!\n");
            longjmp(error_env, ERR_MEMORY);
            break;
        case 3:
            printf("  参数错误!\n");
            longjmp(error_env, ERR_PARAM);
            break;
        default:
            printf("  操作成功!\n");
    }
}

void error_handling_demo(void) {
    printf("\n--- setjmp 错误处理模式 ---\n");

    int err = setjmp(error_env);
    if (err == 0) {
        // try 块
        printf("  [try] 开始执行操作\n");
        risky_operation(1);  // 模拟出错
        printf("  这行不会执行\n");
    } else {
        // catch 块
        printf("  [catch] 捕获到错误代码: %d\n", err);
        switch (err) {
            case ERR_FILE:
                printf("  处理: 关闭文件句柄\n");
                break;
            case ERR_MEMORY:
                printf("  处理: 释放内存\n");
                break;
            case ERR_PARAM:
                printf("  处理: 检查参数\n");
                break;
        }
        printf("  [catch] 错误已处理，继续执行\n");
    }
}

// ========== 3. 多层嵌套跳转 ==========
/*
 * longjmp 可以跳过多个函数调用层级
 */
jmp_buf deep_env;

void level_3(void) {
    printf("    level 3: 发生严重错误!\n");
    longjmp(deep_env, 3);  // 直接跳回顶层
}

void level_2(void) {
    printf("    level 2: 调用 level 3\n");
    level_3();
    printf("    这行不会执行\n");
}

void level_1(void) {
    printf("    level 1: 调用 level 2\n");
    level_2();
    printf("    这行不会执行\n");
}

void nested_demo(void) {
    printf("\n--- 多层嵌套跳转 ---\n");
    printf("  调用层级: main → level1 → level2 → level3\n");

    int ret = setjmp(deep_env);
    if (ret == 0) {
        printf("  开始嵌套调用...\n");
        level_1();
        printf("  不会执行到这里\n");
    } else {
        printf("  跨 %d 层跳回! (错误码=%d)\n", ret, ret);
        printf("  跳过了所有中间函数的正常返回\n");
    }
}

// ========== 4. 资源清理问题 ==========
/*
 * longjmp 跳走时，中间函数已分配的
 * 资源（malloc）不会自动释放！
 * 需要在 longjmp 之前或 setjmp 之后
 * 手动清理。
 */
jmp_buf cleanup_env;
int *allocated_data = NULL;

void function_with_malloc(void) {
    allocated_data = (int*)malloc(100 * sizeof(int));
    if (allocated_data == NULL) {
        longjmp(cleanup_env, 1);
    }
    printf("  内存已分配\n");

    // 出错了，跳走
    longjmp(cleanup_env, 2);
}

void cleanup_demo(void) {
    printf("\n--- 资源清理注意 ---\n");

    int ret = setjmp(cleanup_env);
    if (ret == 0) {
        function_with_malloc();
    } else {
        printf("  longjmp 跳回 (错误码=%d)\n", ret);
        // 必须手动清理！longjmp 不会自动释放
        if (allocated_data) {
            free(allocated_data);
            printf("  手动释放已分配的内存\n");
            allocated_data = NULL;
        }
        printf("  清理完成\n");
    }
}

// ========== 5. setjmp 的局限 ==========
void limitations(void) {
    printf("\n--- setjmp 的局限 ---\n");

    /*
     * 1. setjmp 只能在特定上下文中使用：
     *    - 作为表达式：if (setjmp(buf)) { ... }
     *    - switch 条件：switch (setjmp(buf)) { ... }
     *    不能将 setjmp 赋值给变量后使用！
     *
     * 2. longjmp 不能跨线程
     *
     * 3. 不调用析构函数（C++ 的异常更安全）
     */
    printf("1. setjmp 必须是直接的条件表达式\n");
    printf("2. longjmp 不能跨线程使用\n");
    printf("3. 注意资源泄漏：longjmp 跳过中间函数\n");
    printf("4. volatile 变量的值在 longjmp 后不确定\n");
}

// ========== main ==========
int main() {
    printf("===== setjmp / longjmp =====\n\n");

    basic_demo();
    error_handling_demo();
    nested_demo();
    cleanup_demo();
    limitations();

    // 总结
    printf("\n===== 使用场景总结 =====\n");
    printf("适用场景:\n");
    printf("  ✓ 深层嵌套的错误恢复\n");
    printf("  ✓ 类似于 try-catch 的错误处理\n");
    printf("  ✓ 信号处理中的非局部跳转\n");

    printf("\n不适用场景:\n");
    printf("  ✗ 替代正常流程控制\n");
    printf("  ✗ 跨线程使用\n");
    printf("  ✗ C++ 代码（用异常）\n");

    printf("\n注意:\n");
    printf("  longjmp 跳过中间函数不会释放其资源\n");
    printf("  需要在跳转前或跳回后手动清理\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. setjmp 保存栈环境，返回 0（直接调用时）
 * 2. longjmp 跳回 setjmp 位置，返回非零值
 * 3. 可以跨多层函数调用跳转
 * 4. 注意资源泄露：longjmp 不释放中间函数资源
 * 5. 类似 try-throw-catch 的 C 语言实现
 * 6. 不要跨线程使用
 * 7. 生产环境中注意 volatile 变量
 * ============================================
 */
