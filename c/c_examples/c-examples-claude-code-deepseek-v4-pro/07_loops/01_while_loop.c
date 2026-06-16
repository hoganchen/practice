/*
 * ============================================
 * 知识点：while 循环
 * 说明：
 *   while 循环在条件为真时重复执行代码块。
 *   适用于不知道循环次数，但知道终止条件的情况。
 *
 * 语法：
 *   while (条件) {
 *       循环体
 *   }
 *
 *   先判断条件，再执行循环体。
 *   如果条件一开始就为假，循环体一次都不执行。
 *
 * 编译方法：
 *   gcc 01_while_loop.c -o 01_while_loop
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"

int main() {
    // ========== 基本 while 循环 ==========
    printf("===== 基本 while 循环 =====\n");

    int count = 1;
    while (count <= 5) {
        printf("第 %d 次循环\n", count);
        count++;  // 计数器递增，避免无限循环
    }
    printf("循环结束，count = %d\n", count);

    // ========== 计算 1 到 100 的和 ==========
    printf("\n===== 计算 1 到 100 的和 =====\n");

    int sum = 0;
    int i = 1;
    while (i <= 100) {
        sum += i;  // 累加
        i++;
    }
    printf("1 + 2 + ... + 100 = %d\n", sum);

    // ========== 从键盘读取数据直到特定条件 ==========
    printf("\n===== 读取输入直到输入 0 =====\n");
    printf("请输入数字（输入 0 结束）:\n");

    int input;
    int total = 0;
    int count_input = 0;

    /*
     * 先读取一个值，然后检查条件。
     * 这种模式在读取文件或用户输入时很常见。
     */
    printf("请输入第 1 个数: ");
    scanf("%d", &input);

    while (input != 0) {
        total += input;
        count_input++;

        printf("请输入第 %d 个数: ", count_input + 1);
        scanf("%d", &input);
    }

    printf("输入结束，共输入 %d 个数，总和 = %d\n",
           count_input, total);

    // ========== 无限循环与控制 ==========
    printf("\n===== 有限次无限循环 =====\n");
    /*
     * 有时需要在循环体内部判断是否退出。
     * 使用 break 可以跳出循环。
     */
    int n = 1;
    while (1) {  // 条件永远为真
        printf("第 %d 次\n", n);
        n++;

        if (n > 5) {
            printf("达到条件，break 退出\n");
            break;  // 跳出循环
        }
    }

    // ========== 遍历字符数组 ==========
    printf("\n===== 遍历字符串 =====\n");

    char message[] = "Hello!";
    int idx = 0;

    printf("逐个字符输出: ");
    while (message[idx] != '\0') {  // '\0' 是字符串结束标志
        printf("%c ", message[idx]);
        idx++;
    }
    printf("\n");

    // ========== 数字反转 ==========
    printf("\n===== 数字反转 =====\n");

    int num = 12345;
    int reversed = 0;
    int original = num;

    while (num > 0) {
        int digit = num % 10;        // 取最后一位
        reversed = reversed * 10 + digit;  // 拼接到结果
        num = num / 10;              // 去掉最后一位
    }
    printf("%d 反转后是 %d\n", original, reversed);

    // ========== 猜数字游戏 ==========
    printf("\n===== 猜数字游戏 =====\n");
    int secret = 42;
    int guess = 0;
    int attempts = 0;

    printf("猜一个 1-100 之间的数字:\n");

    while (guess != secret) {
        printf("你的猜测: ");
        scanf("%d", &guess);
        attempts++;

        if (guess < secret) {
            printf("太小了！\n");
        } else if (guess > secret) {
            printf("太大了！\n");
        } else {
            printf("恭喜！你在第 %d 次猜中了！\n", attempts);
        }
    }

    // ========== while vs do-while ==========
    printf("\n===== while vs do-while 对比 =====\n");

    // while：先判断，可能一次都不执行
    int cond = 0;
    printf("while 循环 (条件一开始为假):\n");
    while (cond) {
        printf("这行不会输出\n");
    }
    printf("循环体一次都没执行\n");

    printf("\ndo-while 循环 (条件一开始为假):\n");
    do {
        printf("这行至少会输出一次\n");
    } while (cond);

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. while (条件) — 条件为真时循环
 * 2. 循环变量更新（如 i++）避免死循环
 * 3. break 可以提前退出循环
 * 4. while 先判断后执行，可能一次都不执行
 * 5. 常用于不确定次数的循环（如读取输入）
 * ============================================
 */
