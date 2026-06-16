/*
 * ============================================
 * 知识点：do-while 循环
 * 说明：
 *   do-while 循环与 while 类似，但保证
 *   循环体至少执行一次。因为条件判断在
 *   循环体之后。
 *
 * 语法：
 *   do {
 *       循环体
 *   } while (条件);  // 注意末尾的分号！
 *
 * 适用场景：
 *   - 至少需要执行一次的操作
 *   - 菜单选择（先显示菜单，再获取输入）
 *   - 用户输入验证（先输入，再判断有效性）
 *
 * 编译方法：
 *   gcc 03_do_while_loop.c -o 03_do_while_loop
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"

int main() {
    // ========== 基本 do-while 循环 ==========
    printf("===== 基本 do-while 循环 =====\n");

    int count = 1;
    do {
        printf("第 %d 次循环\n", count);
        count++;
    } while (count <= 5);

    printf("循环结束，count = %d\n", count);

    // ========== do-while vs while 对比 ==========
    printf("\n===== do-while vs while 对比 =====\n");

    int x = 10;

    printf("while (条件一开始为假):\n");
    while (x < 5) {
        printf("这行不会输出\n");
        x++;
    }
    printf("while: 循环体一次都没执行\n");

    printf("\ndo-while (同样条件):\n");
    x = 10;
    do {
        printf("这行会输出，因为 do-while 至少执行一次\n");
        x++;
    } while (x < 5);
    printf("x = %d\n", x);

    // ========== 菜单选择 ==========
    printf("\n===== 菜单选择 =====");

    int choice;
    do {
        printf("\n\n请选择操作:\n");
        printf("1. 新建文件\n");
        printf("2. 打开文件\n");
        printf("3. 保存文件\n");
        printf("0. 退出\n");
        printf("请输入: ");
        scanf("%d", &choice);

        switch (choice) {
            case 1:
                printf("→ 执行: 新建文件\n");
                break;
            case 2:
                printf("→ 执行: 打开文件\n");
                break;
            case 3:
                printf("→ 执行: 保存文件\n");
                break;
            case 0:
                printf("→ 正在退出...\n");
                break;
            default:
                printf("→ 无效选择，请重新输入\n");
        }
    } while (choice != 0);

    printf("程序已退出\n");

    // ========== 输入验证 ==========
    printf("\n===== 输入验证 =====\n");

    int age;
    int valid;

    do {
        printf("请输入年龄 (1-150): ");
        valid = scanf("%d", &age);

        // 清除输入缓冲区
        while (getchar() != '\n');

        if (valid != 1 || age < 1 || age > 150) {
            printf("输入无效！年龄必须在 1-150 之间。\n");
        }
    } while (valid != 1 || age < 1 || age > 150);

    printf("有效年龄: %d\n", age);

    // ========== 累加直到满足条件 ==========
    printf("\n===== 累加直到超过阈值 =====\n");

    int target = 100;
    int current = 0;
    int terms = 0;

    do {
        terms++;
        current += terms;
        printf("加到 %d: 当前值 = %d\n", terms, current);
    } while (current < target);

    printf("从 1 加到 %d 时超过 %d（总和 = %d）\n",
           terms, target, current);

    // ========== 数字位数的计算 ==========
    printf("\n===== 计算数字位数 =====\n");

    int number = 12345;
    int temp = number;
    int digits = 0;

    /*
     * do-while 确保至少有一位数字时
     * 也会正确计算（number = 0 时，位数为 1）
     */
    do {
        digits++;
        temp /= 10;
    } while (temp > 0);

    printf("%d 有 %d 位数字\n", number, digits);

    // 对比：如果 number = 0，while 循环会出错
    int zero = 0;
    int zero_digits = 0;
    int zero_temp = zero;

    // while 版本：不会执行循环体
    while (zero_temp > 0) {
        zero_digits++;
        zero_temp /= 10;
    }
    printf("while 版本: 0 有 %d 位（错误！）\n", zero_digits);

    // do-while 版本：至少执行一次
    zero_temp = zero;
    zero_digits = 0;
    do {
        zero_digits++;
        zero_temp /= 10;
    } while (zero_temp > 0);
    printf("do-while 版本: 0 有 %d 位（正确）\n", zero_digits);

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. do-while 保证循环体至少执行一次
 * 2. 条件在循环体之后判断，末尾必须有分号
 * 3. 适用于菜单选择、输入验证等场景
 * 4. 当至少需要一次执行时使用 do-while
 * 5. while 适合"不满足条件则不执行"的场景
 * ============================================
 */
