/*
 * ============================================
 * 知识点：break 和 continue
 * 说明：
 *   break 和 continue 用于控制循环的执行流：
 *
 *   break    — 立即跳出整个循环（或 switch）
 *   continue — 跳过本次循环的剩余部分，进入下一次迭代
 *
 * 适用场景：
 *   break:    找到目标后提前结束搜索
 *   continue: 跳过不需要处理的数据项
 *
 * 编译方法：
 *   gcc 04_break_continue.c -o 04_break_continue
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"

int main() {
    // ========== break 基础 ==========
    printf("===== break 基础 =====\n");

    printf("在 1-10 中找到第一个能被 3 整除的数:\n");
    for (int i = 1; i <= 10; i++) {
        if (i % 3 == 0) {
            printf("找到: %d\n", i);
            break;  // 找到后立即退出循环
        }
        printf("检查 %d...\n", i);
    }

    // ========== continue 基础 ==========
    printf("\n===== continue 基础 =====\n");

    printf("输出 1-10 中所有奇数: ");
    for (int i = 1; i <= 10; i++) {
        if (i % 2 == 0) {
            continue;  // 偶数跳过，不执行 printf
        }
        printf("%d ", i);
    }
    printf("\n");

    // ========== break 和 continue 对比 ==========
    printf("\n===== break vs continue =====\n");

    printf("原始数据 1-10:\n");
    for (int i = 1; i <= 10; i++) {
        printf("%d ", i);
    }

    printf("\n\ncontinue (跳过 5): ");
    for (int i = 1; i <= 10; i++) {
        if (i == 5) {
            continue;  // 跳过 5，继续循环
        }
        printf("%d ", i);
    }

    printf("\n\nbreak (遇到 5 停止): ");
    for (int i = 1; i <= 10; i++) {
        if (i == 5) {
            break;  // 遇到 5 立即结束循环
        }
        printf("%d ", i);
    }
    printf("\n");

    // ========== 嵌套循环中的 break ==========
    printf("\n===== 嵌套循环中的 break =====\n");
    /*
     * break 只跳出它所在的最内层循环。
     * 外层循环继续执行。
     */

    for (int i = 1; i <= 5; i++) {
        printf("外层 [%d]: ", i);
        for (int j = 1; j <= 5; j++) {
            if (j > i) {
                break;  // 只跳出内层循环
            }
            printf("%d ", j);
        }
        printf("\n");  // 外层循环继续
    }

    // ========== 嵌套循环中的 continue ==========
    printf("\n===== 嵌套循环中的 continue =====\n");

    for (int i = 1; i <= 3; i++) {
        for (int j = 1; j <= 3; j++) {
            if (i == j) {
                continue;  // 跳过对角线元素（需注意作用域）
            }
            printf("(%d,%d) ", i, j);
        }
        printf("\n");
    }

    // ========== 使用标志变量退出多层循环 ==========
    printf("\n===== 退出多层循环（使用标志） =====\n");

    int found = 0;  // 标志变量
    int matrix[4][4] = {
        { 1,  2,  3,  4},
        { 5,  6,  7,  8},
        { 9, 10, 11, 12},
        {13, 14, 15, 16}
    };

    int target = 7;
    int row = -1, col = -1;

    for (int i = 0; i < 4 && !found; i++) {
        for (int j = 0; j < 4; j++) {
            if (matrix[i][j] == target) {
                row = i;
                col = j;
                found = 1;       // 设置标志
                break;           // 退出内层循环
            }
        }
        // 外层循环条件中的 !found 会终止外层循环
    }

    printf("在 matrix 中找到 %d 的位置: [%d][%d]\n",
           target, row, col);

    // ========== 使用 goto 退出多层循环 ==========
    printf("\n===== 使用 goto 退出多层循环 =====\n");
    /*
     * goto 可以一次性跳出多层循环，比标志变量更直接。
     * 但 goto 应谨慎使用，只在特定场景下合理。
     */

    for (int i = 0; i < 4; i++) {
        for (int j = 0; j < 4; j++) {
            if (matrix[i][j] == 11) {
                printf("找到 11 在 [%d][%d]\n", i, j);
                goto found_eleven;  // 跳转到标签
            }
        }
    }
    printf("没找到 11\n");

found_eleven:  // goto 的目标标签
    printf("继续执行后面的代码\n");

    // ========== 实际应用：数据过滤 ==========
    printf("\n===== 应用：数据过滤 =====\n");

    int data[] = {8, -3, 5, -1, 0, 9, -6, 4, -2, 7};
    int data_len = sizeof(data) / sizeof(data[0]);

    printf("原始数据: ");
    for (int i = 0; i < data_len; i++) {
        printf("%d ", data[i]);
    }

    printf("\n\n只处理正数（跳过负数和0）: ");
    for (int i = 0; i < data_len; i++) {
        if (data[i] <= 0) {
            continue;  // 跳过非正数
        }
        printf("%d ", data[i]);
    }

    printf("\n\n遇到负数停止并报告: ");
    for (int i = 0; i < data_len; i++) {
        if (data[i] < 0) {
            printf("\n遇到负数 %d，停止处理\n", data[i]);
            break;
        }
        printf("%d ", data[i]);
    }

    // ========== switch 中的 break ==========
    printf("\n===== switch 中的 break =====\n");

    char grade = 'B';
    switch (grade) {
        case 'A':
            printf("优秀\n");
            break;  // 跳出 switch
        case 'B':
            printf("良好\n");
            break;  // 如果没有 break，会继续执行下面的 case
        case 'C':
            printf("中等\n");
            break;
        default:
            printf("其他\n");
    }

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. break 退出当前循环/switch
 * 2. continue 跳过本次循环剩余部分
 * 3. break/continue 只作用于最内层循环
 * 4. 退出多层循环：标志变量 或 goto
 * 5. break 在 switch 中用于防止穿透
 * 6. continue 在 while/do-while 中小心更新位置
 * ============================================
 */
