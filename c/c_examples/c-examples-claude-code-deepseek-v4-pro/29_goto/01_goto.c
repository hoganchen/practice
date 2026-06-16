/*
 * ============================================
 * 知识点：goto 语句与标签
 * 说明：
 *   goto 语句无条件跳转到同一函数内的标签位置。
 *   在 C 语言中，goto 主要用于：
 *   1. 跳出多层嵌套循环
 *   2. 集中式错误处理和资源清理
 *   3. 状态机实现
 *
 *   goto 的争议：
 *   - 滥用 goto 导致"意大利面条式代码"
 *   - 合理使用（如 cleanup 模式）可以提高可读性
 *   - Linux 内核大量使用 goto 做错误处理
 *
 * 编译方法：
 *   gcc 01_goto.c -o 01_goto
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <stdlib.h>
#include <string.h>

// ========== 1. 跳出多层循环 ==========
/*
 * goto 可以一次性跳出多层嵌套循环，
 * 而 break 只能跳出最内层。
 */
void break_multi_loops(void) {
    printf("--- 跳出多层循环 ---\n");

    int matrix[4][4] = {
        { 1,  2,  3,  4},
        { 5,  6,  7,  8},
        { 9, 10, 11, 12},
        {13, 14, 15, 16}
    };

    int target = 7;

    for (int i = 0; i < 4; i++) {
        for (int j = 0; j < 4; j++) {
            if (matrix[i][j] == target) {
                printf("找到 %d 在 [%d][%d]\n",
                       target, i, j);
                goto found;  // 直接跳到 found 标签
            }
        }
    }
    printf("未找到 %d\n", target);

found:
    // goto 目标标签
    printf("继续执行后续代码\n\n");
}

// ========== 2. 错误处理与资源清理 ==========
/*
 * 这是 goto 最被推荐的使用场景。
 * 当需要分配多个资源时，goto 可以集中清理。
 */
int process_data(void) {
    FILE *fp = NULL;
    char *buffer = NULL;
    int *data = NULL;
    int ret = -1;  // 默认错误

    // 步骤1：打开文件
    fp = fopen("test_data.txt", "r");
    if (fp == NULL) {
        perror("打开文件失败");
        goto cleanup;
    }

    // 步骤2：读取文件大小
    fseek(fp, 0, SEEK_END);
    long size = ftell(fp);
    rewind(fp);
    if (size <= 0) {
        fprintf(stderr, "文件为空\n");
        goto cleanup;
    }

    // 步骤3：分配缓冲区
    buffer = (char*)malloc(size + 1);
    if (buffer == NULL) {
        fprintf(stderr, "内存分配失败\n");
        goto cleanup;
    }

    // 步骤4：读取文件
    if (fgets(buffer, size + 1, fp) == NULL) {
        fprintf(stderr, "读取失败\n");
        goto cleanup;
    }

    // 步骤5：分配数据处理区
    data = (int*)malloc(100 * sizeof(int));
    if (data == NULL) {
        fprintf(stderr, "数据区分配失败\n");
        goto cleanup;
    }

    // 成功处理
    printf("成功读取: %s\n", buffer);
    ret = 0;  // 成功

cleanup:
    // 集中清理：安全释放所有资源
    if (data)   { free(data);   printf("  数据区已释放\n"); }
    if (buffer) { free(buffer); printf("  缓冲区已释放\n"); }
    if (fp)     { fclose(fp);   printf("  文件已关闭\n");   }
    return ret;
}

// ========== 3. 状态机中的 goto ==========
void state_machine_example(void) {
    printf("--- 状态机 ---\n");

    char *input = "abc123";
    int i = 0;

    // 简单的状态机：解析字符串
    enum { STATE_LETTER, STATE_DIGIT, STATE_DONE } state;

    state = STATE_LETTER;

start:
    if (input[i] == '\0') goto done;

    switch (state) {
        case STATE_LETTER:
            if (input[i] >= 'a' && input[i] <= 'z') {
                printf("%c: 字母\n", input[i]);
                i++;
                goto start;  // 继续解析
            }
            state = STATE_DIGIT;
            goto start;

        case STATE_DIGIT:
            if (input[i] >= '0' && input[i] <= '9') {
                printf("%c: 数字\n", input[i]);
                i++;
                goto start;
            }
            // 遇到非数字，结束
            state = STATE_DONE;
            goto done;

        case STATE_DONE:
            goto done;
    }

done:
    printf("状态机结束\n\n");
}

// ========== 4. goto 的局限和风险 ==========
void goto_risks(void) {
    printf("--- goto 的风险 ---\n");

    // 错误1：跳进代码块内（跳过变量初始化）
    printf("1. 不能从外部跳进代码块\n");
    // goto inside;  // 错误！跳过初始化
    {
        int x = 42;
        printf("   x = %d\n", x);
    // inside:
    }

    // 错误2：goto 不能跨函数跳转
    printf("2. goto 必须在同一函数内\n");

    // 错误3：过度使用导致代码难以阅读
    printf("3. 过度使用 goto 产生[意大利面条]式代码\n");

    // 正确的使用原则
    printf("\n合理使用 goto 的原则:\n");
    printf("  • 只向前跳转（不要向后跳）\n");
    printf("  • 用于 cleanup 模式（向下跳转）\n");
    printf("  • 跳出多层循环\n");
    printf("  • 不要滥用，能用结构化方式就不用\n");
}

// ========== 5. 不用 goto 的替代方案 ==========
void no_goto_alternative(void) {
    printf("--- 替代方案 ---\n");

    // 1. break 跳出单层循环
    for (int i = 0; i < 10; i++) {
        if (i == 5) break;
    }

    // 2. 标志变量跳出多层
    int found = 0;
    for (int i = 0; i < 4 && !found; i++) {
        for (int j = 0; j < 4; j++) {
            if (i * j == 6) {
                found = 1;
                break;
            }
        }
    }

    // 3. 函数返回处理错误
    printf("  替代: 函数返回 + 标志变量\n");
}

// ========== main ==========
int main() {
    printf("===== goto 语句 =====\n\n");

    break_multi_loops();

    // 先创建测试文件
    FILE *fp = fopen("test_data.txt", "w");
    if (fp) {
        fprintf(fp, "Hello, goto cleanup!\n");
        fclose(fp);
    }

    printf("--- 错误处理 cleanup 模式 ---\n");
    int result = process_data();
    printf("处理结果: %s\n\n",
           result == 0 ? "成功" : "失败");

    state_machine_example();
    goto_risks();
    no_goto_alternative();

    // 清理
    remove("test_data.txt");

    // 总结
    printf("\n===== goto 使用原则 =====\n");
    printf("DO use goto for:\n");
    printf("  ✓ 跳出多层循环\n");
    printf("  ✓ 集中式错误清理 (cleanup)\n");
    printf("  ✓ 状态机/自动机\n");

    printf("\nDON'T use goto for:\n");
    printf("  ✗ 替代常规流程控制（if/for/while）\n");
    printf("  ✗ 向后跳转（创建循环）\n");
    printf("  ✗ 跳进代码块或函数\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. goto 无条件跳转到同一函数的标签
 * 2. 最推荐用法：错误处理 cleanup 模式
 * 3. 可以一次跳出多层循环
 * 4. 不能跨函数跳转，不能跳进变量初始化代码块
 * 5. 只向前跳转，避免向后跳
 * 6. Linux 内核等高质量 C 代码合理使用 goto
 * ============================================
 */
