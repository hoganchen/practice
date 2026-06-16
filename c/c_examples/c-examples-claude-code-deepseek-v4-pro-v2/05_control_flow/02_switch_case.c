/**
 * ============================================================
 * 知识点: switch-case 多分支选择语句 (Switch-Case Statement)
 * ============================================================
 *
 * 【编译指令】
 *   gcc 02_switch_case.c -o 02_switch_case.exe -std=c11 -Wall
 *
 * 【运行指令】
 *   ./02_switch_case.exe
 *
 * 【知识点概述】
 *   switch-case 是一种多分支选择结构，根据一个整型或字符型表达式的值，
 *   跳转到对应的 case 标签处执行。包括：
 *     - switch (表达式) { case 常量: ... }
 *     - break 语句的重要性（控制 fall-through）
 *     - default 分支（处理所有未匹配的情况）
 *     - 多个 case 标签共享同一执行代码块
 *     - case 穿透（fall-through）机制
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>

/**
 * 主函数
 */
int main(void)
{
    printf("========================================\n");
    printf("  switch-case 多分支选择语句 示例\n");
    printf("========================================\n\n");

    // ---------------------------------------------------------
    // 示例 1: 基本的 switch-case 结构
    // 根据输入的数字 1-7 输出对应的星期几
    // ---------------------------------------------------------
    printf("【示例 1】基本的 switch-case 结构\n");

    int day = 3;  // 表示星期三（1=周一, ..., 7=周日）

    // switch 表达式的值必须是整型（int、char、enum 等）
    switch (day) {
        case 1:  // 如果 day == 1
            printf("  星期一\n");
            break;  // 跳出 switch 语句，继续执行 switch 之后的代码

        case 2:
            printf("  星期二\n");
            break;

        case 3:
            printf("  星期三\n");  // day=3，执行这一行
            break;                  // 遇到 break，跳出 switch

        case 4:
            printf("  星期四\n");
            break;

        case 5:
            printf("  星期五\n");
            break;

        case 6:
            printf("  星期六\n");
            break;

        case 7:
            printf("  星期日\n");
            break;

        default:  // 如果 day 的值不匹配任何 case 标签
            printf("  无效的星期数字！请输入 1-7 之间的数字。\n");
            break;
    }
    printf("\n");

    // ---------------------------------------------------------
    // 示例 2: break 的重要性 —— fall-through（穿透）现象
    // 如果一个 case 后面没有 break，程序会"落入"下一个 case 继续执行
    // ---------------------------------------------------------
    printf("【示例 2】break 的重要性 —— fall-through（穿透）\n");

    int n = 2;

    printf("  当 n=%d 时，没有 break 的 switch：\n", n);
    switch (n) {
        case 1:
            printf("    执行 case 1\n");
            // 没有 break，会继续执行 case 2
        case 2:
            printf("    执行 case 2\n");
            // 没有 break，会继续执行 case 3
        case 3:
            printf("    执行 case 3\n");
            break;  // 遇到 break，跳出
        default:
            printf("    执行 default\n");
            break;
    }
    printf("  说明：n=2 从 case 2 开始执行，因为没有 break，穿透到了 case 3\n");
    printf("\n");

    // ---------------------------------------------------------
    // 示例 3: 多个 case 标签共享同一代码块
    // 利用 fall-through 特性，将多个 case 合并处理
    // ---------------------------------------------------------
    printf("【示例 3】多个 case 标签共享同一代码块\n");

    char grade = 'B';  // 学生等级

    printf("  等级: %c\n", grade);
    switch (grade) {
        // 多个 case 标签叠在一起，执行同一段代码
        case 'A':
        case 'B':
        case 'C':
            printf("  成绩合格！通过了考试。\n");
            break;

        case 'D':
            printf("  成绩不合格，需要补考。\n");
            break;

        case 'F':
            printf("  成绩不及格，需要重修。\n");
            break;

        default:
            printf("  无效的等级。\n");
            break;
    }
    printf("\n");

    // ---------------------------------------------------------
    // 示例 4: switch 与字符类型
    // switch 经常用于处理字符选择，实现简单的菜单
    // ---------------------------------------------------------
    printf("【示例 4】switch 与字符类型 —— 模拟简单菜单\n");

    char option = 'b';  // 用户选择的操作

    printf("  用户选择了: %c\n", option);
    switch (option) {
        case 'a':
        case 'A':
            printf("  执行添加操作...\n");
            break;

        case 'b':
        case 'B':
            printf("  执行删除操作...\n");  // 匹配到 'b'
            break;

        case 'c':
        case 'C':
            printf("  执行查询操作...\n");
            break;

        case 'q':
        case 'Q':
            printf("  退出程序。\n");
            break;

        default:
            printf("  无效选项，请重新选择。\n");
            break;
    }
    printf("\n");

    // ---------------------------------------------------------
    // 示例 5: 故意使用 fall-through 实现连续区间判断
    // ---------------------------------------------------------
    printf("【示例 5】利用 fall-through 实现范围判断\n");

    int month = 6;  // 6 月份

    printf("  月份: %d 月\n", month);
    switch (month) {
        // 利用 fall-through 将 1-6 月归为"上半年"
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
            printf("  上半年 (1-6月)\n");
            break;

        // 7-12 月归为"下半年"
        case 7:
        case 8:
        case 9:
        case 10:
        case 11:
        case 12:
            printf("  下半年 (7-12月)\n");
            break;

        default:
            printf("  无效的月份！\n");
            break;
    }
    printf("\n");

    // ---------------------------------------------------------
    // 示例 6: switch 内部声明变量
    // 注意：在 case 内部声明变量需要加花括号形成独立作用域
    // ---------------------------------------------------------
    printf("【示例 6】switch 中声明局部变量\n");

    int code = 100;

    switch (code) {
        case 100:
        {
            // 加上花括号，创建独立的作用域
            int local_var = 42;  // 可以安全地在 case 中声明变量
            printf("  状态码 100: 继续 (local_var = %d)\n", local_var);
            break;
        }

        case 200:
        {
            int local_var = 99;  // 与上面的 local_var 互不干扰
            printf("  状态码 200: 成功 (local_var = %d)\n", local_var);
            break;
        }

        default:
            printf("  未知状态码: %d\n", code);
            break;
    }
    printf("\n");

    // ---------------------------------------------------------
    // 示例 7: if-else 与 switch 的选择
    //   - if-else: 适合范围判断、浮点数判断、复杂逻辑
    //   - switch:  适合基于离散值的精确匹配，可读性更好
    // ---------------------------------------------------------
    printf("【示例 7】if-else 与 switch 的选择\n");

    int value = 42;

    // 适合用 if-else 的场景：范围判断
    if (value >= 0 && value < 10) {
        printf("  value 在 [0, 10) 范围内\n");
    } else if (value >= 10 && value < 100) {
        printf("  value 在 [10, 100) 范围内\n");
    } else {
        printf("  value >= 100\n");
    }

    // 适合用 switch 的场景：离散值的精确匹配
    switch (value) {
        case 0:
            printf("  value 恰好为 0\n");
            break;
        case 42:
            printf("  value 恰好为 42 —— 生命、宇宙及一切的答案！\n");
            break;
        case 100:
            printf("  value 恰好为 100\n");
            break;
        default:
            printf("  value 不是 0、42 或 100\n");
            break;
    }
    printf("\n");

    printf("========================================\n");
    printf("  switch-case 要点总结:\n");
    printf("  1. 表达式必须为整型或字符型\n");
    printf("  2. 不要忘记 break，除非有意利用 fall-through\n");
    printf("  3. 始终包含 default 分支，处理意外情况\n");
    printf("  4. 多个 case 可共享同一代码块\n");
    printf("  5. case 中声明变量时需加 {} 作用域\n");
    printf("========================================\n");

    return 0;
}
