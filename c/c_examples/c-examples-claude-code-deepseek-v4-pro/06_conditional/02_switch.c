/*
 * ============================================
 * 知识点：switch 语句
 * 说明：
 *   switch 用于多分支选择，比多个 if-else if
 *   更清晰。表达式必须是整型（int、char、enum）。
 *   case 标签必须是编译时常量。
 *
 * 语法：
 *   switch (表达式) {
 *       case 常量1:
 *           语句;
 *           break;  // 跳出 switch，否则会"穿透"到下一个 case
 *       case 常量2:
 *           语句;
 *           break;
 *       default:    // 可选，所有 case 都不匹配时执行
 *           语句;
 *   }
 *
 * 编译方法：
 *   gcc 02_switch.c -o 02_switch
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"

int main() {
    // ========== 基本 switch 用法 ==========
    printf("===== 基本 switch 用法 =====\n");
    int grade = 'B';

    switch (grade) {
        case 'A':
            printf("优秀 (90-100)\n");
            break;  // 跳出 switch 语句
        case 'B':
            printf("良好 (80-89)\n");
            break;
        case 'C':
            printf("中等 (70-79)\n");
            break;
        case 'D':
            printf("及格 (60-69)\n");
            break;
        case 'F':
            printf("不及格 (0-59)\n");
            break;
        default:
            printf("无效的成绩等级\n");
    }

    // ========== 穿透 (fall-through) ==========
    printf("\n===== 穿透特性 =====\n");
    /*
     * 如果 case 后不加 break，会继续执行下一个 case，
     * 直到遇到 break 或 switch 结束。
     * 可以利用这个特性合并多个 case。
     */
    int month = 4;

    switch (month) {
        case 1:
        case 3:
        case 5:
        case 7:
        case 8:
        case 10:
        case 12:
            printf("%d 月有 31 天\n", month);
            break;
        case 4:
        case 6:
        case 9:
        case 11:
            printf("%d 月有 30 天\n", month);
            break;
        case 2:
            printf("%d 月有 28 或 29 天\n", month);
            break;
        default:
            printf("无效月份\n");
    }

    // ========== 多个值映射到同一结果 ==========
    printf("\n===== 多个值映射 =====\n");
    char vowel = 'a';

    switch (vowel) {
        case 'a':
        case 'e':
        case 'i':
        case 'o':
        case 'u':
        case 'A':
        case 'E':
        case 'I':
        case 'O':
        case 'U':
            printf("'%c' 是元音字母\n", vowel);
            break;
        default:
            printf("'%c' 是辅音字母\n", vowel);
    }

    // ========== switch 配合 int ==========
    printf("\n===== 整型 switch =====\n");
    int score = 85;
    int level = score / 10;  // 将分数映射到 0-10

    switch (level) {
        case 10:
        case 9:
            printf("成绩等级: 优秀\n");
            break;
        case 8:
            printf("成绩等级: 良好\n");
            break;
        case 7:
            printf("成绩等级: 中等\n");
            break;
        case 6:
            printf("成绩等级: 及格\n");
            break;
        default:
            printf("成绩等级: 不及格\n");
    }

    // ========== switch 和 enum 配合 ==========
    printf("\n===== switch + enum =====\n");
    enum Weekday { MON, TUE, WED, THU, FRI, SAT, SUN };
    enum Weekday today = WED;

    switch (today) {
        case MON:
            printf("周一：开始工作\n");
            break;
        case TUE:
        case WED:
        case THU:
            printf("周中：努力工作\n");
            break;
        case FRI:
            printf("周五：准备周末\n");
            break;
        case SAT:
        case SUN:
            printf("周末：休息\n");
            break;
    }

    // ========== 显式穿透标注 ==========
    printf("\n===== 显式穿透 (C23) =====\n");
    int num = 2;

    switch (num) {
        case 1:
            printf("一\n");
            // C23 可以用 [[fallthrough]] 标注有意穿透
            // 但在旧标准中，通常用注释说明
            // fall through
        case 2:
            printf("二\n");
            break;
        default:
            printf("其他\n");
    }

    // ========== switch 的限制 ==========
    printf("\n===== switch 的限制 =====\n");
    /*
     * 1. case 值必须是编译时常量
     * 2. 表达式必须是整型（int、char、enum、_Bool）
     * 3. 不能用于浮点数比较
     * 4. 不能用于字符串比较
     *
     * 对于字符串的"switch"，需要使用 if-else + strcmp()
     */

    // 错误的做法（无法编译）：
    // float f = 1.5;
    // switch (f) { ... }  // 错误！浮点不能用于 switch

    // 字符串比较需要用 if-else
    char *cmd = "start";
    // 无法写成 switch(cmd)
    if (cmd[0] == 's') {
        printf("执行 start 命令\n");
    } else if (cmd[0] == 'q') {
        printf("执行 quit 命令\n");
    }

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. switch 表达式必须是整型（int/char/enum）
 * 2. case 标签必须是编译时常量
 * 3. 不要忘记 break，否则会穿透
 * 4. 利用穿透可以合并多个 case
 * 5. default 处理所有未匹配的情况
 * 6. 浮点数和字符串不能用于 switch
 * ============================================
 */
